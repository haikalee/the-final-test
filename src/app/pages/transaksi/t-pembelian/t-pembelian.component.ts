import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective } from 'angular-datatables';
import * as moment from 'moment';
import { LandaService } from 'src/app/core/services/landa.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-t-pembelian',
  templateUrl: './t-pembelian.component.html',
  styleUrls: ['./t-pembelian.component.scss']
})
export class TPembelianComponent implements OnInit {
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
  daterange: any = {};
  listPembelian: any;
  listCustomer: any;
  listSatuan: any;
  listBarang: any;
  listSupplier: any;
  listBeli: any;
  detailPembelian: any;
  maxLength: any;
  modelParam: { waktu: { periode_awal, periode_akhir } };
  model: {
    no_invoice,
    tanggal,
    foto: { base64 },
    total
  };
  options: any = {
    locale: { format: "YYYY-MM-DD" },
    alwaysShowCalendars: false,
  };

  myForm = new FormGroup({
    fileUpload: new FormControl("", [Validators.required]),
  });

  constructor(private landaService: LandaService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.pageTitle = "Pembelian";
    this.breadCrumbItems = [
      {
        label: "Kasir",
      },
      {
        label: "Pembelian",
        activate: true,
      },
    ];
    this.model = {
      no_invoice: '',
      tanggal: {},
      foto: { base64: "" },
      total: 0
    };
    this.modelParam = {
      waktu: {
        periode_awal: '',
        periode_akhir: ''
      }
    };
    this.listPembelian = [];
    this.listBeli = [];
    this.maxLength = [];
    this.getData();
    this.empty();
  }

  index() {
    this.empty();
    this.getData();
    this.showForm = !this.showForm;
    this.pageTitle = "Pembelian";
    this.isView = false;
    this.isEdit = false;
  }

  view(val) {
    this.empty();
    this.getSatuan();
    this.getBarang();
    this.getDetail(val.id);
    this.showForm = !this.showForm;
    this.isView = true;
    this.isEdit = false;
    this.model = val;
    this.model.tanggal = this.toDate(val.tanggal);
    this.pageTitle = "Pembelian";
    this.model.foto = this.landaService.getImage("pembelian", val.foto);
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.isView = false;
    this.isEdit = false;
    this.pageTitle = "Tambah Pembelian";
    this.getSatuan();
    this.getBarang();
    this.model.no_invoice = `PMB000${this.listBeli.length + 1}`;
    this.model.foto = this.landaService.getImage("pembelian", 'default.png');
  }

  save() {
    const final = {
      model: this.model,
      pembelian: this.listPembelian,
    };
    this.landaService
      .DataPost("/t_pembelian/save", final)
      .subscribe((res: any) => {
        if (res.status_code === 200) {
          this.landaService.alertSuccess("berhasil", "data berhasil dimasukkan");
          this.index();
        } else {
          this.landaService.alertError("Mohon Maaf", res.errors);
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
          .DataPost("/t_pembelian/delete", data)
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
          .DataGet("/t_pembelian/index", params)
          .subscribe((res: any) => {
            this.listBeli = res.data.list;
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
    this.model = {
      no_invoice: '',
      tanggal: {},
      foto: { base64: "" },
      total: 0
    };
    this.listPembelian = [];
    this.listBarang = [];
  }

  addRow(listPembelian) {
    const newRow = {
      id_t_pembelian: 0,
      jumlah: 0,
      diskon: 0,
      total: 0,
    };

    listPembelian.push(newRow);
  }

  removeRow(i, total) {
    this.listPembelian.splice(i, 1);
  }

  total() {
    let total = 0;
    this.listPembelian.forEach((val) => {
      if (val.jumlah) {
        val.total = 0;
        val.total = val.harga_beli * val.jumlah;
      }
      total += val.total;
    });
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
    this.landaService.DataGet('/m_barang/index', {}).subscribe((res: any) => {
      this.listBarang = res.data.list;
    });
  }

  getSatuan() {
    this.landaService.DataGet('/m_satuan/index', {}).subscribe((res: any) => {
      this.listSatuan = res.data.list;
    });
  }

  getDetail(id = null) {
    this.landaService
      .DataGet("/t_pembelian/detail", {
        id,
      })
      .subscribe((res: any) => {
        this.listPembelian = res.data;
        console.log(res.data);
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

  modalNota(modal, val) {
    this.modalService.open(modal, { size: "lg", backdrop: "static" });
    this.model.foto = this.landaService.getImage("pembelian", val.foto);
  }

  close() {
    this.modalService.dismissAll();
  }

  onFileChange(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.model.foto = {
          base64: reader.result as string,
        };
        this.myForm.patchValue({
          fileUpload: reader.result,
        });
      };
    }
  }
}
