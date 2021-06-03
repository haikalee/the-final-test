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
    ->orderBy('t_penjualan.no_invoice DESC');

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
  if ($validasi === true) {
    try {
      if (isset($params['model'])) {
        $params['model']['tanggal'] = $landa->arrayToDate($params['model']['tanggal']);
        $params['model']['tanggal'] = strtotime(date('Y-m-d', strtotime($params['model']['tanggal'])));
        $model = $db->insert('t_penjualan', $params['model']);
      }

      foreach ($params['penjualan'] as $p) {
        $history = [];
        $barang = (array) $db->select('*')->from('m_barang')->where('m_barang.id', '=', $p['m_barang_id'])->find();
        $history['jumlah_awal'] = $barang['jumlah'];
        $laporanStok['penambahan'] = 0;
        $laporanStok['pengurangan'] = $p['jumlah'];
        $laporanStok['stok_awal'] = $barang['jumlah'];
        $laporanStok['real_stok'] = $barang['jumlah'] - $laporanStok['pengurangan'];
        $barang['jumlah'] -= $p['jumlah'];
        $p['t_penjualan_id'] = $model->id;
        $db->update('m_barang', $barang, ['id' => $p['m_barang_id']]);
        $laporanStok['kode'] = $barang['kode'];
        $laporanStok['m_barang_id'] = $p['m_barang_id'];
        $laporanStok['tanggal'] = $params['model']['tanggal'];
        $db->insert('l_stok', $laporanStok);
        $penjualan = $db->insert('t_penjualan_det', $p);
        $history['t_penjualan_det_id'] = $penjualan->id;
        $history['jumlah_penjualan'] = $p['jumlah'];
        $db->insert('t_penjualan_history', $history);
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
    $barang = (array) $db->select('*')->from('m_barang')->where('m_barang.id', '=', $d->m_barang_id)->find();
    $barang['jumlah'] += $d->jumlah;
    $db->update('m_barang', $barang, ['id' => $d->m_barang_id]);
  }

  $model = $db->update('t_penjualan', ['is_deleted' => 1], ['id' => $params['id']]);

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
