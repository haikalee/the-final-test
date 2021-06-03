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
    ->orderBy('t_pembelian.no_invoice DESC');

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
        $stok = (array) $db->select('*')->from('l_stok')->where('l_stok.m_barang_id', '=', $p['m_barang_id'])->find();
        $laporanStok['stok_awal'] = $barang['jumlah'];
        $history['jumlah_awal'] = $barang['jumlah'];
        $laporanStok['penambahan'] = $p['jumlah'];
        $laporanStok['pengurangan'] = 0;
        $laporanStok['real_stok'] = $barang['jumlah'] + $laporanStok['penambahan'];
        $barang['jumlah'] += $p['jumlah'];
        $p['t_pembelian_id'] = $model->id;
        $db->update('m_barang', $barang, ['id' => $p['m_barang_id']]);
        $laporanStok['kode'] = $barang['kode'];
        $laporanStok['m_barang_id'] = $p['m_barang_id'];
        $laporanStok['tanggal'] = $params['model']['tanggal'];
        $db->insert('l_stok', $laporanStok);
        $pembelian = $db->insert('t_pembelian_det', $p);
        $history['t_pembelian_det_id'] = $pembelian->id;
        $history['jumlah_pembelian'] = $p['jumlah'];
        $db->insert('t_pembelian_history', $history);
      }

      return successResponse($response, $pembelian);
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
    $barang = (array) $db->select('*')->from('m_barang')->where('m_barang.id', '=', $d->m_barang_id)->find();
    $barang['jumlah'] -= $d->jumlah;
    $db->update('m_barang', $barang, ['id' => $d->m_barang_id]);
  }

  $model = $db->update('t_pembelian', ['is_deleted' => 1], ['id' => $params['id']]);

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
