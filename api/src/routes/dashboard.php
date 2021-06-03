<?php

use Service\Db;

$app->get('/dashboard/getdata', function ($request, $response) {
  $tanggal = strtotime(date('Y/m/d'));
  $params = $request->getParams();
  $db = Db::db();

  $barang = $db->select('*')
    ->from('m_barang')
    ->where('m_barang.is_deleted', '=', 0)
    ->findAll();

  $penjualan = $db->select('*')
    ->from('t_penjualan')
    ->where('t_penjualan.is_deleted', '=', 0)
    ->where('t_penjualan.tanggal', '=', $tanggal)
    ->findAll();

  $pembelian = $db->select('*')
    ->from('t_pembelian')
    ->where('t_pembelian.is_deleted', '=', 0)
    ->where('t_pembelian.tanggal', '=', $tanggal)
    ->findAll();

  $data = [
    'barang' => count($barang),
    'penjualan' => count($penjualan),
    'pembelian' => count($pembelian),
  ];
  return successResponse($response, $data);
});
