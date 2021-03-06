<?php

use Service\Db;
use Service\Landa;

function Validasi($data, $custom = array())
{
  $validasi = array(
    'nama' => 'required',
  );

  $cek = validate($data, $validasi, $custom);
  return $cek;
}

$app->get('/m_konsumen/index', function ($request, $response) {
  $params = $request->getParams();
  $db = DB::db();

  $data = $db->select('*')
    ->from('m_konsumen')
    ->where('m_konsumen.is_deleted', '=', 0)
    ->orderBy('m_konsumen.id DESC');

  if (isset($params['filter'])) {
    $filter = (array) json_decode($params['filter']);
    foreach ($filter as $key => $value) {
      if ($key == 'nama') {
        $data->where('m_konsumen.nama', 'LIKE', $value);
      }
    }
  }

  if (isset($params['limit']) && !empty($params['limit'])) {
    $data->limit($params['limit']);
  }

  if (isset($params['offset']) && !empty($params['offset'])) {
    $data->offset($params['offset']);
  }

  $models = $data->findAll();
  $totalItems = $data->count();

  return successResponse($response, [
    'list' => $models,
    'totalItems' => $totalItems
  ]);
});

$app->post('/m_konsumen/save', function ($request, $response) {
  $data = $request->getParams();
  $db = Db::db();
  $landa = new Landa();
  $validasi = Validasi($data);
  if ($validasi === true) {
    if (isset($data['tanggal'])) {
      $data['tanggal'] = $landa->arrayToDate($data['tanggal']);
    }

    if (isset($data['foto']['base64']) && !empty($data['foto']['base64'])) {
      $path = 'assets/img/supplier/';
      $uploadFile = $landa->base64ToImage($path,  $data['foto']['base64']);

      if ($uploadFile) {
        $data['foto'] = $uploadFile['data'];
      } else {
        return unprocessResponse($response, [$uploadFile['error']]);
      }
    }

    try {
      if (isset($data['id'])) {
        $model = $db->update('m_konsumen', $data, ['id' => $data['id']]);
      } else {
        $model = $db->insert('m_konsumen', $data);
      }

      return successResponse($response, $model);
    } catch (Exception $e) {
      return unprocessResponse($response, ['terjadi masalah pada server']);
    }
    return unprocessResponse($response, $validasi);
  }
});

$app->post('/m_konsumen/delete', function ($request, $response) {
  $data = $request->getparams();
  $db = Db::db();
  $model = $db->update('m_konsumen', ['is_deleted' => 1], ['id' => $data['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['Terjadi masalah pada server']);
});
$app->get('/m_konsumen/trash', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('m_konsumen')->where('is_deleted', '=', 1);

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
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->post('/m_konsumen/restore', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $model = $db->update('m_konsumen', ['is_deleted' => 0], ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->post('/m_konsumen/delete_permanen', function ($request, $response) {
  $params  = $request->getParams();
  $db    = Db::db();
  $model = $db->delete('m_konsumen', ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});
