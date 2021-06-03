import { Component, OnInit, ViewChild } from "@angular/core";
import { DataTableDirective } from "angular-datatables";
import { LandaService } from "../../../core/services/landa.service";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-pengguna",
  templateUrl: "./pengguna.component.html",
  styleUrls: ["./pengguna.component.scss"],
})
export class PenggunaComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: any;
  breadCrumbItems: Array<{}>;
  pageTitle: string;
  isView: boolean;
  isEdit: boolean;
  modelParam: {
    nama;
    kategori;
  };
  listData: any;
  listJabatan: any;
  listAkses: any;
  showForm: boolean;
  listKabupaten: any;
  listProvinsi: any;
  listSupplier: any;
  listStatus: any;

  modelCheck: {
    DataMaster;
    DataTransaksi;
    DataLaporan;
  };
  model: {
    nama;
    password;
    username;
    foto: { base64 };

    akses: {
      barang;
      pengguna;
      satuan;
      konsumen;
      tipe_barang;
      supplier;
      pembelian;
      t_pembelian
      t_penjualan;
      l_pembelian;
      l_penjualan;
    };
  };

  constructor(private landaService: LandaService, private router: Router) { }

  ngOnInit(): void {
    this.pageTitle = "Pengguna";
    this.breadCrumbItems = [
      {
        label: "Master",
      },
      {
        label: "Pengguna",
        active: true,
      },
    ];
    this.modelParam = {
      nama: "",
      kategori: "",
    };
    this.getData();
    this.empty();
  }

  myForm = new FormGroup({
    fileUpload: new FormControl("", [Validators.required]),
  });

  reloadDataTable(): void {
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
        const params = {
          filter: JSON.stringify(this.modelParam),
          offset: dataTablesParameters.start,
          limit: dataTablesParameters.length,
        };
        this.landaService
          .DataGet("/m_pengguna/index", params)
          .subscribe((res: any) => {
            this.listData = res.data.list;

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
    this.modelCheck = {
      DataMaster: false,
      DataTransaksi: false,
      DataLaporan: false,
    };
    this.model = {
      nama: "",
      password: "",
      username: "",
      foto: {
        base64: ''
      },

      akses: {
        barang: false,
        pengguna: false,
        satuan: false,
        konsumen: false,
        tipe_barang: false,
        supplier: false,
        pembelian: false,
        t_pembelian: false,
        t_penjualan: false,
        l_pembelian: false,
        l_penjualan: false,
      },
    };
    this.getData();
  }

  checkAllKolom(val, arr) {
    arr.forEach((value: any, key: any) => {
      Object.keys(value).forEach((key) => {
        if (val) {
          this.model.akses[value] = true;
        } else {
          this.model.akses[value] = false;
        }
      });
    });
  }

  index() {
    this.showForm = !this.showForm;
    this.pageTitle = "Data Pengguna";
    this.getData();
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Tambah Data Pengguna";
    this.isView = false;
    this.model.foto = this.landaService.getImage("users", 'default.png');
  }

  edit(val) {
    this.showForm = !this.showForm;
    this.model = val;
    this.model.password = "";
    this.pageTitle = "Pengguna : " + val.nama;
    this.isView = false;
    this.isEdit = true;
    this.model.foto = this.landaService.getImage("users", val.foto);
  }

  view(val) {
    this.showForm = !this.showForm;
    this.model = val;
    this.model.foto = this.landaService.getImage("users", val.foto);
    this.pageTitle = "Pengguna : " + val.nama;
    this.isView = true;
  }

  save() {
    const final = Object.assign(this.model);
    if (final.password.length < 6) {
      this.landaService.alertError(
        "Gagal",
        "Password harus lebih dari 6 huruf!"
      );
    } else {
      this.landaService
        .DataPost("/m_pengguna/save", final)
        .subscribe((res: any) => {
          if (res.status_code === 200) {
            this.landaService.alertSuccess(
              "Berhasil",
              "Data berhasil diinput!"
            );
            this.index();
          } else {
            this.landaService.alertError("Mohon Maaf", res.errors);
          }
        });
    }
  }

  delete(val) {
    const data = {
      id: val != null ? val.id : null,
      is_deleted: 1,
    };
    Swal.fire({
      title: "Apakah anda yakin ?",
      text: "Menghapus data Pengguna akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_pengguna/delete", data)
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data Pengguna telah dihapus !"
              );
              this.reloadDataTable();
            } else {
              this.landaService.alertError("Mohon Maaf", res.errors);
            }
          });
      }
    });
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
