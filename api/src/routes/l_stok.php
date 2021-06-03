<?php

use Service\Db;

function to($hasil)
{
  $nilai = [
    'tanggal' => date('Y-m-d', $hasil[0]->tanggal),
    'rows' => count($hasil),
    'details' => $hasil
  ];
  return $nilai;
}

function toList($data)
{
  // ej($data);
  $tanggal = [];
  $akhir = [];

  foreach ($data as $d) {
    array_push($tanggal, $d->tanggal);
  }

  foreach (array_unique($tanggal) as $t) {
    $hasil = [];
    foreach ($data as $d) {
      if ($d->tanggal == $t) {
        array_push($hasil, $d);
      }
    }
    array_push($akhir, to($hasil));
  }

  return $akhir;
}

$app->get('/l_stok/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('l_stok.*, m_barang.nama as barang, m_barang.kode as kode')
    ->from('l_stok')
    ->leftJoin('m_barang', 'l_stok.m_barang_id = m_barang.id')
    ->where('l_stok.tanggal', '>=', strtotime(date('Y-m-d', strtotime($params['periode_mulai']))))
    ->andWhere('l_stok.tanggal', '<=', strtotime(date('Y-m-d', strtotime($params['periode_selesai']))))
    ->findAll();

  $finalData = toList($data);

  $arr = [
    'list' => $finalData,
    'data_atas' => [
      'periode_awal' => $params['periode_mulai'],
      'periode_akhir' => $params['periode_selesai'],
    ]
  ];

  if (isset($params['is_export']) && 1 == $params['is_export']) {
    $view = twigView();
    $content = $view->fetch('laporan/stok.html', $arr);
    ej($arr);
    echo $content;
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;Filename="List stok.xls"');
  } elseif (isset($params['is_print']) && 1 == $params['is_print']) {
    $view = twigView();
    $content = $view->fetch('laporan/stok.html', $arr);
    echo $content;
    echo '<script type="text/javascript">window.print();setTimeout(function () { window.close(); }, 500);</script>';
  } else {
    return successResponse($response, $arr);
  }
});
