<?php

use Service\Db;
use Service\Landa;

function Validasi($data, $custom = array())
{
  $validasi = array(
    'tanggal' => 'required',
    'no_invoice' => 'required',
  );

  return validate($data, $validasi, $custom);
}

$app->get('/t_penjualan/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $landa = new Landa();
  $data = $db->select('*')
    ->from('t_penjualan')
    ->where('t_penjualan.is_deleted', '=', 0)
    ->orderBy('t_penjualan.id DESC');

  if (isset($params['filter'])) {
    $filter = (array) json_decode($params['filter']);
    foreach ($filter as $key => $value) {
      if ($key == 'waktu') {
        if ($value->periode_awal != '' && $value->periode_akhir != '') {
          $data->where('t_penjualan.tanggal', '>=', strtotime(date('Y-m-d', strtotime($value->periode_awal))))
            ->andWhere('t_penjualan.tanggal', '<=   ', strtotime(date('Y-m-d', strtotime($value->periode_akhir))));
        }
      }
    }
  }

  if (isset($params['limit']) && !empty($params['llimit'])) {
    $data->limit($params['limit']);
  }

  if (isset($params['offset']) && !empty($params['offset'])) {
    $data->offset($params['offset']);
  }

  if (isset($params['isPrint'])) {
    $view = twigView();
    $konsumen = $db->select('*')->from('m_konsumen')->where('id', '=', $params['dataAtas']['m_konsumen_id'])->find();
    $params['dataAtas']['m_konsumen_id'] = $konsumen;
    $params['dataAtas']['tanggal'] = $landa->arrayToDate($params['dataAtas']['tanggal']);

    for ($i = 0; $i < count($params['dataDetail']); $i++) {
      $params['dataDetail'][$i]['m_barang_id'] = (array) $db->select('*')->from('m_barang')->where('id', '=', $params['dataDetail'][$i]['m_barang_id'])->find();
      $params['dataDetail'][$i]['m_satuan_id'] = (array) $db->select('*')->from('m_satuan')->where('id', '=', $params['dataDetail'][$i]['m_satuan_id'])->find();
    }
    $content = $view->fetch('laporan/struk.html', $params);
    echo $content;
    echo '<script type="text/javascript">window.print();setTimeout(function () { window.close(); }, 500);</script>';
    return;
  }

  $models = $data->findAll();
  $totalItems = $data->count();

  foreach ($models as $model) {
    $model->tanggal = date('Y-m-d', $model->tanggal);
  }

  return successResponse($response, [
    'list' => $models,
    'totalItems' => $totalItems
  ]);
});

$app->post('/t_penjualan/save', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $landa = new Landa();
  $validasi = Validasi($params['model']);
  $fail = [];
  if ($validasi === true) {
    try {
      if (empty($fail) && isset($params['model'])) {
        $params['model']['tanggal'] = $landa->arrayToDate($params['model']['tanggal']);
        $params['model']['tanggal'] = strtotime(date('Y-m-d', strtotime($params['model']['tanggal'])));
        $model = $db->insert('t_penjualan', $params['model']);
      }

      if (count($fail) == 0) {
        foreach ($params['penjualan'] as $p) {
          $history = [];
          $laporanStok = [];
          $barang = (array) $db->select('*')->from('m_barang')->where('m_barang.id', '=', $p['m_barang_id'])->find();
          $stokBarang = (array) $db->select('*')->from('l_stok')->where('m_barang_id', '=', $p['m_barang_id'])->find();
          $p['t_penjualan_id'] = $model->id;
          $laporanStok['kode'] = $barang['kode'];
          $laporanStok['m_barang_id'] = $p['m_barang_id'];
          $laporanStok['tanggal'] = $params['model']['tanggal'];
          $laporanStok['penambahan'] = 0;
          $laporanStok['pengurangan'] = $p['jumlah'];
          $history['t_penjualan_det_id'] = $model->id;
          $history['jumlah_penjualan'] = $p['jumlah'];
          $penjualan = $db->insert('t_penjualan_det', $p);
          $laporanStok['t_penjualan_det_id'] = $penjualan->id;
          $laporanStok['stok_awal'] = $stokBarang['total'];
          $laporanStok['total'] = $stokBarang['total'] - $p['jumlah'];
          $stokBarang['total'] -= $p['jumlah'];
          $db->update('l_stok', $stokBarang, ['id' => $stokBarang['id']]);
          $db->insert('l_kartu_stok', $laporanStok);
          $db->insert('t_penjualan_history', $history);
        }
      }

      return successResponse($response, $penjualan);
    } catch (Exception $e) {
      return unprocessResponse($response, ['terjadi masalah pada server']);
    }
  }
  return unprocessResponse($response, $validasi);
});

$app->post('/t_penjualan/delete', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('t_penjualan_det')->where('t_penjualan_id', '=', $params['id'])->findAll();

  foreach ($data as $d) {
    $stokBarang = (array) $db->select('*')->from('l_stok')->where('m_barang_id', '=', $d->m_barang_id)->find();
    $stokBarang['total'] += $d->jumlah;
    $db->update('l_stok', $stokBarang, ['id' => $stokBarang['id']]);
  }

  $model = $db->update('t_penjualan', ['is_deleted' => 1], ['id' => $params['id']]);
  $db->delete('t_penjualan_det', ['t_penjualan_id' => $params['id']]);
  $db->delete('l_kartu_stok', ['t_penjualan_det_id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->get('/t_penjualan/detail', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();

  $data = $db->select('t_penjualan_det.*,
                        m_barang.id,
                        m_barang.m_satuan_id,
                        m_barang.harga_jual,
                        m_barang.harga_beli')
    ->from('t_penjualan_det')
    ->where('t_penjualan_det.t_penjualan_id', '=', $params['id'])
    ->leftJoin('m_barang', 't_penjualan_det.m_barang_id = m_barang.id')
    ->orderBy('t_penjualan_det.id DESC');

  return successResponse($response, $data->findAll());
});
