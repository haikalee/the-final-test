<?php

use Service\Db;

function to($hasil)
{
  $total = 0;
  foreach ($hasil as $h) {
    $total += $h->total;
  };
  $nilai = [
    'tanggal' => date('Y-m-d', $hasil[0]->tanggal),
    'rows' => count($hasil),
    'total' => $total,
    'details' => $hasil
  ];
  return $nilai;
}

function toList($data)
{
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

$app->get('/l_pembelian/index', function ($request, $response) {
  $params = $request->getParams();
  $db = Db::db();
  $data = $db->select('
    t_pembelian.*,
    t_pembelian_det.*,
    m_barang.nama,
    m_barang.kode,
    m_barang.harga_beli,
    m_supplier.nama as supplier,
    m_tipe_barang.nama as tipe,
    m_satuan.nama as satuan')
    ->from('t_pembelian')
    ->leftJoin('t_pembelian_det', 't_pembelian_det.t_pembelian_id = t_pembelian.id')
    ->leftJoin('m_barang', 't_pembelian_det.m_barang_id = m_barang.id')
    ->leftJoin('m_supplier', 'm_barang.m_supplier_id = m_supplier.id')
    ->leftJoin('m_tipe_barang', 'm_barang.m_tipe_barang_id = m_tipe_barang.id')
    ->leftJoin('m_satuan', 'm_barang.m_satuan_id = m_satuan.id')
    ->where('t_pembelian.is_deleted', '=', 0)
    ->where('t_pembelian.tanggal', '>=', strtotime(date('Y-m-d', strtotime($params['periode_mulai']))))
    ->andWhere('t_pembelian.tanggal', '<=', strtotime(date('Y-m-d', strtotime($params['periode_selesai']))))
    ->findAll();

  $finalData = toList($data);
  $total = 0;
  foreach ($finalData as $f) {
    $total += $f['total'];
  }

  $arr = [
    'list' => $finalData,
    'data_atas' => [
      'periode_awal' => $params['periode_mulai'],
      'periode_akhir' => $params['periode_selesai'],
      'total_bawah' => $total
    ]
  ];

  if (isset($params['is_export']) && 1 == $params['is_export']) {
    $view = twigView();
    $content = $view->fetch('laporan/pembelian/excel.html', $arr);
    echo $content;
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;Filename="List Pembelian.xls"');
  } elseif (isset($params['is_print']) && 1 == $params['is_print']) {
    $view = twigView();
    $content = $view->fetch('laporan/pembelian/pembelian.html', $arr);
    echo $content;
    echo '<script type="text/javascript">window.print();setTimeout(function () { window.close(); }, 500);</script>';
  } else {
    return successResponse($response, $arr);
  }
});
