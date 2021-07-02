<?php

use Service\Db;
use Service\Firebase;
use Service\Landa;


function validasi($data, $custom = array())
{
  $validasi = array(
    "nama" => "required",
    "username" => "required"
  );
  $cek = validate($data, $validasi, $custom);

  return $cek;
}
$app->get('/m_pengguna/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('m_user.*, m_rules.akses')
    ->from('m_user')
    ->where('m_user.is_deleted', '=', 0)
    ->leftJoin('m_rules', 'm_rules.id = m_user.m_rules_id')
    ->OrderBy('m_user.id', '=', 'DESC');

  if (isset($params["filter"])) {
    $filter = (array) json_decode($params["filter"]);
    foreach ($filter as $key => $val) {
      if ($key == "nama") {
        $data->where('m_user.nama', "LIKE", $val);
      }
    }
  }
  if (isset($params["limit"]) && !empty($params["limit"])) {
    $data->limit($params["limit"]);
  }
  if (isset($params["offset"]) && !empty($params["offset"])) {
    $data->offset($params["offset"]);
  }

  $models = $data->findAll();
  $totalItem = $data->count();
  if (!empty($models)) {
    foreach ($models as $key => $value) {
      $value->akses = json_decode($value->akses);
    }
  }

  return successResponse($response, [
    'list' => $models,
    'totalItems' => $totalItem

  ]);
});


$app->post("/m_pengguna/save", function ($request, $response) {
  $data     = $request->getParams();
  $db = Db::db();
  $landa = new Landa();
  $validasi = validasi($data);

  if (isset($data['id'])) {
    if (!empty($data['password'])) {
      $data["password"] = sha1($data["password"]);
    } else {
      unset($data["password"]);
    }
  } else {
    $data["password"] = isset($data["password"]) ? sha1($data["password"]) : "";
    $validasi = validasi($data, ["password" => "required"]);
  }

  if ($validasi === true) {
    if (isset($data['foto']['base64']) && !empty($data['foto']['base64'])) {
      $path = 'assets/img/users/';
      $uploadFile = $landa->base64ToImage($path,  $data['foto']['base64']);

      if ($uploadFile) {
        $data['foto'] = $uploadFile['data'];
      } else {
        return unprocessResponse($response, [$uploadFile['error']]);
      }
    }

    try {
      // $data["akses"] = json_encode($data["akses"]);
      if (isset($data["id"])) {
        $model = $db->update("m_user", $data, ["id" => $data["id"]]);
      } else {
        $model = $db->insert("m_user", $data);
      }
      return successResponse($response, $model);
    } catch (Exception $e) {
      return unprocessResponse($response, ["Terjadi masalah pada server"]);
    }
  }
  return unprocessResponse($response, $validasi);
});


$app->post("/m_pengguna/delete", function ($request, $response) {
  $data     = $request->getParams();
  $db = Db::db();
  $model = $db->update("m_user", ['is_deleted' => 1], ['id' => $data['id']]);
  // $models = $db->delete("m_bahan_penunjang_det", ['m_bahan_penunjang_id' => $data['id']]);
  if (isset($model)) {
    return successResponse($response, [$model]);
  }

  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->get('/m_pengguna/getid', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('m_user')->where('id', '=', $params['id'])->find();

  return successResponse($response, $data);
});

$app->get('/m_pengguna/trash', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('*')->from('m_user')->where('is_deleted', '=', 1);

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

$app->post('/m_pengguna/restore', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $model = $db->update('m_user', ['is_deleted' => 0], ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});

$app->post('/m_pengguna/delete_permanen', function ($request, $response) {
  $params  = $request->getParams();
  $db    = Db::db();
  $model = $db->delete('m_user', ['id' => $params['id']]);

  if (isset($model)) {
    return successResponse($response, [$model]);
  }
  return unprocessResponse($response, ['terjadi masalah pada server']);
});
