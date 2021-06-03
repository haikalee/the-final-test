import { NgModule, Component } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MBarangComponent } from "./m-barang/m-barang.component";
import { MKonsumenComponent } from "./m-konsumen/m-konsumen.component";
import { MSatuanComponent } from "./m-satuan/m-satuan.component";
import { MSupplierComponent } from "./m-supplier/m-supplier.component";
import { MTipeBarangComponent } from "./m-tipe-barang/m-tipe-barang.component";

import { PenggunaComponent } from "./pengguna/pengguna.component";

const routes: Routes = [
  {
    path: "pengguna",
    component: PenggunaComponent,
  },
  {
    path: 'supplier',
    component: MSupplierComponent
  },
  {
    path: 'satuan',
    component: MSatuanComponent
  },
  {
    path: 'konsumen',
    component: MKonsumenComponent
  },
  {
    path: 'tipe-barang',
    component: MTipeBarangComponent
  },
  {
    path: 'barang',
    component: MBarangComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MasterRoutingModule { }
