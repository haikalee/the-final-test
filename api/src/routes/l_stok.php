<?php

use Service\Db;

// function proses($penjualan, $pembelian)
// {
//   $jumlahPenjualan = 0;
//   $jumlahPembelian = 0;

//   foreach ($penjualan as $pnj) {
//     $jumlahPenjualan += $pnj->jumlah;
//   }

//   foreach ($pembelian as $pmb) {
//     $jumlahPembelian += $pmb->jumlah;
//   }

//   return ['penjualan' => $jumlahPenjualan, 'pembelian' => $jumlahPembelian];
// }

$app->get('/l_stok/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('l_stok.*, m_barang.nama as nama, m_barang.kode as kode')
    ->from('l_stok')
    ->leftJoin('m_barang', 'l_stok.m_barang_id = m_barang.id')
    ->findAll();

  if (isset($params['is_export']) && 1 == $params['is_export']) {
    $view = twigView();
    $content = $view->fetch('laporan/stok/excel.html', $data);
    echo $content;
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;Filename="List stok.xls"');
  } elseif (isset($params['is_print']) && 1 == $params['is_print']) {
    $view = twigView();
    $content = $view->fetch('laporan/stok/stok.html', $data);
    echo $content;
    echo '<script type="text/javascript">window.print();setTimeout(function () { window.close(); }, 500);</script>';
  } else {
    return successResponse($response, $data);
  }
});
