import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import * as moment from 'moment';
import { LandaService } from 'src/app/core/services/landa.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-t-penjualan',
  templateUrl: './t-penjualan.component.html',
  styleUrls: ['./t-penjualan.component.scss']
})
export class TPenjualanComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: DataTables.Settings;
  pageTitle: string;
  breadCrumbItems: Array<{}>;
  isView: boolean;
  isEdit: boolean;
  showForm: boolean;
  kondisi: boolean;
  showAllData: boolean;
  isMember: boolean;
  daterange: any = {};
  listPenjualan: any;
  listCustomer: any;
  listSatuan: any;
  listBarang: any;
  listSupplier: any;
  listJual: any;
  listKonsumen: any;
  detailPenjualan: any;
  apiURL = environment.apiURL;
  modelParam: { waktu: { periode_awal, periode_akhir } };
  model: any = {};
  options: any = {
    locale: { format: "YYYY-MM-DD" },
    alwaysShowCalendars: false,
  };

  constructor(private landaService: LandaService) { }

  ngOnInit(): void {
    this.pageTitle = "Penjualan";
    this.breadCrumbItems = [
      {
        label: "Kasir",
      },
      {
        label: "Penjualan",
        activate: true,
      },
    ];
    this.modelParam = {
      waktu: {
        periode_awal: '',
        periode_akhir: ''
      }
    };
    this.listPenjualan = [];
    this.listJual = [];
    this.getData();
    this.empty();
    this.showAllData = true;
    this.kondisi = false;
    this.isMember = false;
  }

  changeMember() {
    this.isMember = !this.isMember;
  }
  index() {
    this.empty();
    this.getData();
    this.showForm = !this.showForm;
    this.pageTitle = "penjualan";
    this.isView = false;
    this.isEdit = false;
  }

  view(val) {
    this.empty();
    this.getSatuan();
    this.getBarang();
    this.getKonsumen();
    this.getDetail(val.id);
    this.showForm = !this.showForm;
    this.isView = true;
    this.isEdit = false;
    this.isMember = true;
    this.model = val;
    this.model.tanggal = this.toDate(val.tanggal);
    this.pageTitle = "penjualan";
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.isView = false;
    this.isEdit = false;
    this.pageTitle = "Tambah penjualan";
    this.isMember = false;
    this.getSatuan();
    this.getBarang();
    this.getKonsumen();
    this.model.no_invoice = `PNJ000${this.listJual.length + 1}`;
  }

  save() {
    if (this.isMember == false) {
      this.model.m_konsumen_id = 4;
    }
    const final = {
      model: this.model,
      penjualan: this.listPenjualan,
    };
    this.landaService
      .DataPost("/t_penjualan/save", final)
      .subscribe((res: any) => {
        if (res.status_code === 200) {
          this.landaService.alertSuccess("berhasil", "data berhasi dimasukkan");
          this.index();
        } else {
          this.landaService.alertError("Mohon Maaf", res.errors);
          this.index();
        }
      });
  }

  delete(val) {
    const data = {
      id: val != null ? val.id : null,
      is_deleted: 1,
    };
    Swal.fire({
      title: "Apakah anda yakin ?",
      text: "Menghapus data Hp akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/t_penjualan/delete", data)
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "berhasil",
                "data telah tersimpan"
              );
              this.reloadDataTable();
            } else {
              this.landaService.alertError("Mohon maaf", res.errors);
            }
          });
      }
    });
  }

  reloadDataTable() {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.draw();
    });
  }

  getData() {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ordering: false,
      pagingType: "full_numbers",
      ajax: (dataTablesParameters: any, callback) => {
        if (this.kondisi == true && this.showAllData == false) {
          this.modelParam.waktu.periode_awal = moment(this.daterange.start).format("YYYY-MM-DD");
          this.modelParam.waktu.periode_akhir = moment(this.daterange.end).format("YYYY-MM-DD");
        }

        if (this.showAllData) {
          this.modelParam.waktu.periode_awal = '';
          this.modelParam.waktu.periode_akhir = '';
        }

        const params = {
          filter: JSON.stringify(this.modelParam),
          offset: dataTablesParameters.start,
          limit: dataTablesParameters.length,
        };

        this.landaService
          .DataGet("/t_penjualan/index", params)
          .subscribe((res: any) => {
            this.listJual = res.data.list;
            callback({
              recordsTotal: res.data.totalItems,
              recordsFiltered: res.data.totalItems,
              data: [],
            });
          });
      },
    };
  }

  empty() {
    this.model = {};
    this.listPenjualan = [];
    this.listBarang = [];
    this.isMember = false;
  }

  addRow(listPenjualan) {
    const newRow = {
      id_t_penjualan: 0,
      jumlah: 0,
      diskon: 0,
      total: 0,
    };

    listPenjualan.push(newRow);
  }

  removeRow(i, total) {
    this.listPenjualan.splice(i, 1);
  }

  total() {
    let total = 0;
    this.listPenjualan.forEach((val) => {
      if (val.jumlah) {
        val.total = 0;
        val.total = val.harga_jual * val.jumlah;
      }

      total += val.total;
    });
    if (this.model.diskon) {
      const diskon = total * (this.model.diskon / 100);
      total -= diskon;
    }
    this.model.total = total;
  }

  selectBarang(val, id) {
    this.landaService.DataGet('/m_barang/getbarang', { id }).subscribe((res: any) => {
      val.m_satuan_id = res.data.m_satuan_id;
      val.harga_jual = res.data.harga_jual;
      val.harga_beli = res.data.harga_beli;
    });
  }

  getBarang() {
    this.landaService.DataGet('/m_barang/listbarang', {}).subscribe((res: any) => {
      this.listBarang = res.data;
    });
  }

  getKonsumen() {
    this.landaService.DataGet('/m_konsumen/index', {}).subscribe((res: any) => {
      this.listKonsumen = res.data.list;
    });
  }

  getSatuan() {
    this.landaService.DataGet('/m_satuan/index', {}).subscribe((res: any) => {
      this.listSatuan = res.data.list;
    });
  }

  getDetail(id = null) {
    this.landaService
      .DataGet("/t_penjualan/detail", {
        id,
      })
      .subscribe((res: any) => {
        this.listPenjualan = res.data;
        this.total();
      });
  }

  selectedDate(value: any, datepicker?: any) {
    this.kondisi = true;
    this.showAllData = false;
    datepicker.start = value.start;
    datepicker.end = value.end;
    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;
    this.reloadDataTable();
  }

  allData() {
    this.showAllData = true;
    this.kondisi = false;
    this.reloadDataTable();
  }

  print() {
    const data = {
      dataAtas: this.model,
      dataDetail: this.listPenjualan,
      isPrint: true
    };
    window.open(
      this.apiURL + "/t_penjualan/index?" + $.param(data),
      "_blank"
    );
  }

  toDate(dob) {
    if (dob) {
      const [year, month, day] = dob.split("-");
      const obj = {
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
      };
      return obj;
    }
  }
}
