<?php

use Service\Db;
use Service\Landa;

function Validasi($data, $custom = array())
{
  $validasi = array(
    'nama' => 'required',
    'm_supplier_id' => 'required',
    'm_tipe_barang_id' => 'required',
    'm_satuan_id' => 'required',
    'jumlah' => 'required',
    'harga_beli' => 'required',
    'harga_jual' => 'required',
  );
  $cek = validate($data, $validasi, $custom);

  return $cek;
}

$app->get('/m_barang/index', function ($request, $response) {
  $params = $request->getParams();
  $db     = Db::db();

  $data = $db->select('m_barang.*, m_supplier.nama as supplier, m_tipe_barang.nama as tipe_barang, m_satuan.nama as satuan')
    ->from('m_barang')
    ->leftJoin('m_supplier', 'm_barang.m_supplier_id = m_supplier.id')
    ->leftJoin('m_tipe_barang', 'm_barang.m_tipe_barang_id = m_tipe_barang.id')
    ->leftJoin('m_satuan', 'm_barang.m_satuan_id = m_satuan.id')
    ->where('m_barang.is_deleted', '=', 0)
    ->orderBy('m_barang.id DESC');

  if (isset($params['filter'])) {
    $filter = (array) json_decode($params['filter']);
    foreach ($filter as $key => $value) {
      if ($key == 'nama') {
        $data->where('m_barang.nama', 'LIKE', $value);
      } else if ($key == 'kode') {
        $data->where('m_barang.kode', 'LIKE', $value);
      } else if ($key == 'm_supplier_id') {
        if ($value) {
          $nilai = join(',', $value);
          $data->customWhere('m_supplier.id IN (' . $nilai . ')', "AND");
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

  $models     = $data->findAll();
  $totalItems = $data->count();

  return successResponse($response, [
    'list' => $models,
    'totalItems' => $totalItems
  ]);
});

$app->post('/m_barang/save', function ($request, $response) {
  $data = $request->getParams();
  $db   = Db::db();
  $landa = new Landa();

  $validasi = Validasi($data);
  if ($validasi === true) {
    if (isset($data['tanggal'])) {
      $data['tanggal'] = $landa->arrayToDate($data['tanggal']);
    }
    try {
      if (isset($data['id'])) {
        $model = $db->update('m_barang', $data, ['id' => $data['id']]);
      } else {
        $model = $db->insert('m_barang', $data);
      }
      return successResponse($response, $data);
    } catch (Exception $e) {
      return unprocessResponse($response, ['Terjadi Masalah pada Server']);
    }
  }
  return unprocessResponse($response, $validasi);
});

$app->post('/m_barang/delete', function ($request, $response) {
  $data  = $request->getParams();
  $db    = Db::db();
  $model = $db->update('m_barang', ['is_deleted' => 1], ['id' => $data['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->get('/m_barang/listbarang', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('m_barang.*, m_supplier.nama as supplier, m_tipe_barang.nama as tipe_barang, m_satuan.nama as satuan')
    ->from('m_barang')
    ->leftJoin('m_supplier', 'm_barang.m_supplier_id = m_supplier.id')
    ->leftJoin('m_tipe_barang', 'm_barang.m_tipe_barang_id = m_tipe_barang.id')
    ->leftJoin('m_satuan', 'm_barang.m_satuan_id = m_satuan.id')
    ->where('m_barang.is_deleted', '=', 0)
    ->orderBy('m_barang.id DESC');

  return successResponse($response, $data->findAll());
});

$app->get('/m_barang/getbarang', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('m_barang.*, m_supplier.nama as supplier, m_tipe_barang.nama as tipe_barang, m_satuan.nama as satuan')
    ->from('m_barang')
    ->leftJoin('m_supplier', 'm_barang.m_supplier_id = m_supplier.id')
    ->leftJoin('m_tipe_barang', 'm_barang.m_tipe_barang_id = m_tipe_barang.id')
    ->leftJoin('m_satuan', 'm_barang.m_satuan_id = m_satuan.id')
    ->where('m_barang.id', '=', $params['id'])
    ->orderBy('m_barang.id DESC');

  return successResponse($response, $data->find());
});
