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

$app->get('/m_supplier/index', function ($request, $response) {
  $params = $request->getParams();
  $db = DB::db();

  $data = $db->select('*')
    ->from('m_supplier')
    ->where('m_supplier.is_deleted', '=', 0)
    ->orderBy('m_supplier.id DESC');

  if (isset($params['filter'])) {
    $filter = (array) json_decode($params['filter']);
    foreach ($filter as $key => $value) {
      if ($key == 'nama') {
        $data->where('m_supplier.nama', 'LIKE', $value);
      } else if ($key == 'kode') {
        $data->where('m_supplier.kode', 'LIKE', $value);
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

$app->post('/m_supplier/save', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $landa = new Landa();
  $validasi = Validasi($params);
  if ($validasi === true) {
    if (isset($params['tanggal'])) {
      $params['tanggal'] = $landa->arrayToDate($params['tanggal']);
    }

    if (isset($params['foto']['base64']) && !empty($params['foto']['base64'])) {
      $path = 'assets/img/supplier/';
      $uploadFile = $landa->base64ToImage($path,  $params['foto']['base64']);

      if ($uploadFile) {
        $params['foto'] = $uploadFile['data'];
      } else {
        return unprocessResponse($response, [$uploadFile['error']]);
      }
    }

    try {
      if (isset($params['id'])) {
        $model = $db->update('m_supplier', $params, ['id' => $params['id']]);
      } else {
        $model = $db->insert('m_supplier', $params);
      }

      return successResponse($response, $model);
    } catch (Exception $e) {
      return unprocessResponse($response, ['terjadi masalah pada server']);
    }
    return unprocessResponse($response, $validasi);
  }
});

$app->post('/m_supplier/delete', function ($request, $response) {
  $parms = $request->getparams();
  $db = Db::db();
  $model = $db->update('m_supplier', ['is_deleted' => 1], ['id' => $parms['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['Terjadi masalah pada server']);
});

$app->get('/m_supplier/getsup', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('m_supplier')->where('id', '=', $params['id']);
  return successResponse($response, $data->find());
});


$app->get('/m_supplier/trash', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('m_supplier')->where('is_deleted', '=', 1);

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

$app->post('/m_supplier/restore', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $model = $db->update('m_supplier', ['is_deleted' => 0], ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->post('/m_supplier/delete_permanen', function ($request, $response) {
  $params  = $request->getParams();
  $db    = Db::db();
  $model = $db->delete('m_supplier', ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});
