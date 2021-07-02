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

$app->get('/t_pembelian/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();

  $data = $db->select('*')
    ->from('t_pembelian')
    ->where('t_pembelian.is_deleted', '=', 0)
    ->orderBy('t_pembelian.id DESC');

  if (isset($params['filter'])) {
    $filter = (array) json_decode($params['filter']);
    foreach ($filter as $key => $value) {
      if ($key == 'waktu') {
        if ($value->periode_awal != '' && $value->periode_akhir != '') {
          $data->where('t_pembelian.tanggal', '>=', strtotime(date('Y-m-d', strtotime($value->periode_awal))))
            ->andWhere('t_pembelian.tanggal', '<=', strtotime(date('Y-m-d', strtotime($value->periode_akhir))));
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

$app->post('/t_pembelian/save', function ($request, $response) {
  $params = $request->getParams();
  $landa = new Landa();
  $db = Db::db();
  $validasi = Validasi($params['model']);
  if ($validasi === true) {
    try {
      if (isset($params['model']['foto']['base64']) && !empty($params['model']['foto']['base64'])) {
        $path = 'assets/img/pembelian/';
        $uploadFile = $landa->base64ToImage($path,  $params['model']['foto']['base64']);

        if ($uploadFile) {
          $params['model']['foto'] = $uploadFile['data'];
        } else {
          return unprocessResponse($response, [$uploadFile['error']]);
        }
      }

      if (isset($params['model'])) {
        $params['model']['tanggal'] = $landa->arrayToDate($params['model']['tanggal']);
        $params['model']['tanggal'] = strtotime(date('Y-m-d', strtotime($params['model']['tanggal'])));
        $model = $db->insert('t_pembelian', $params['model']);
      }

      foreach ($params['pembelian'] as $p) {
        $history = [];
        $laporanStok = [];
        $barang = (array) $db->select('*')->from('m_barang')->where('m_barang.id', '=', $p['m_barang_id'])->find();
        $stokBarang = (array) $db->select('*')->from('l_stok')->where('m_barang_id', '=', $p['m_barang_id'])->find();
        $p['t_pembelian_id'] = $model->id;
        $laporanStok['kode'] = $barang['kode'];
        $laporanStok['m_barang_id'] = $p['m_barang_id'];
        $laporanStok['tanggal'] = $params['model']['tanggal'];
        $laporanStok['penambahan'] = $p['jumlah'];
        $laporanStok['pengurangan'] = 0;
        $history['t_pembelian_det_id'] = $model->id;
        $history['jumlah_pembelian'] = $p['jumlah'];
        $pembelian = $db->insert('t_pembelian_det', $p);
        $laporanStok['t_pembelian_det_id'] = $pembelian->id;
        if (!isset($stokBarang['id'])) {
          $laporanStok['total'] = $p['jumlah'];
          $laporanStok['stok_awal'] = 0;
          $db->insert('l_stok', $laporanStok);
        } else {
          $laporanStok['stok_awal'] = $stokBarang['total'];
          $laporanStok['total'] = $p['jumlah'] + $stokBarang['total'];
          $stokBarang['total'] += $p['jumlah'];
          $db->update('l_stok', $stokBarang, ['id' => $stokBarang['id']]);
        }
        $db->insert('l_kartu_stok', $laporanStok);
        $db->insert('t_pembelian_history', $history);
      }

      return successResponse($response, $model);
    } catch (Exception $e) {
      return unprocessResponse($response, ['terjadi masalah pada server']);
    }
  }
  return unprocessResponse($response, $validasi);
});

$app->post('/t_pembelian/delete', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('t_pembelian_det')->where('t_pembelian_id', '=', $params['id'])->findAll();

  foreach ($data as $d) {
    $stokBarang = (array) $db->select('*')->from('l_stok')->where('m_barang_id', '=', $d->m_barang_id)->find();
    $stokBarang['total'] -= $d->jumlah;
    $db->update('l_stok', $stokBarang, ['id' => $stokBarang['id']]);
  }

  $model = $db->update('t_pembelian', ['is_deleted' => 1], ['id' => $params['id']]);
  $db->delete('t_penjualan_det', ['t_pembelian_id' => $params['id']]);
  $db->delete('l_kartu_stok', ['t_pembelian_det_id' => $params['id']]);
  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->get('/t_pembelian/detail', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();

  $data = $db->select('t_pembelian_det.*,
                        m_barang.id,
                        m_barang.m_satuan_id,
                        m_barang.harga_jual,
                        m_barang.harga_beli')
    ->from('t_pembelian_det')
    ->where('t_pembelian_det.t_pembelian_id', '=', $params['id'])
    ->leftJoin('m_barang', 't_pembelian_det.m_barang_id = m_barang.id')
    ->orderBy('t_pembelian_det.id DESC');

  return successResponse($response, $data->findAll());
});
