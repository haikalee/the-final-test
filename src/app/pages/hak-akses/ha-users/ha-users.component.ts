import { Component, OnInit, ViewChild } from "@angular/core";
import { DataTableDirective } from "angular-datatables";
import { LandaService } from "../../../core/services/landa.service";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: 'app-ha-users',
  templateUrl: './ha-users.component.html',
  styleUrls: ['./ha-users.component.scss']
})
export class HaUsersComponent implements OnInit {
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
  listRules: any;
  isTrash: boolean;
  status: any;

  modelCheck: {
    DataMaster;
    DataTransaksi;
    DataLaporan;
  };
  model: {
    nama;
    password;
    username;
    is_trash;
    foto: { base64 };
    m_rules_id;
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
    this.status = [
      {
        id: 1,
        status: 'trash'
      },
      {
        id: 2,
        status: 'index'
      },
    ]
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
        if (this.model.is_trash == 1) {
          const params = {
            filter: JSON.stringify(this.modelParam),
            offset: dataTablesParameters.start,
            limit: dataTablesParameters.length,
          };
          this.landaService.DataGet('/m_pengguna/trash', {}).subscribe((res: any) => {
            this.listData = res.data.list;
            callback({
              recordsTotal: res.data.totalItems,
              recordsFiltered: res.data.totalItems,
              data: [],
            });
          });
        } else {
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
        }
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
      is_trash: 0,
      foto: {
        base64: ''
      },
      m_rules_id: 0
    };
    this.getData();
  }

  index() {
    this.showForm = !this.showForm;
    this.pageTitle = "Data Pengguna";
    this.getData();
  }

  create() {
    this.empty();
    this.getRules();
    this.showForm = !this.showForm;
    this.pageTitle = "Tambah Data Pengguna";
    this.isView = false;
    this.model.foto = this.landaService.getImage("users", 'default.png');
  }

  edit(val) {
    this.empty();
    this.getRules();
    this.showForm = !this.showForm;
    this.model = val;
    this.model.password = "";
    this.pageTitle = "Pengguna : " + val.nama;
    this.isView = false;
    this.isEdit = true;
    this.model.foto = this.landaService.getImage("users", val.foto);
  }

  view(val) {
    console.log(val);
    this.empty();
    this.getRules();
    this.showForm = !this.showForm;
    this.model = val;
    this.model.foto = this.landaService.getImage("users", val.foto);
    this.pageTitle = "Pengguna : " + val.nama;
    this.isView = true;
  }

  save() {
    const final = Object.assign(this.model);
    if ((final.password.length < 6) && this.isEdit == false) {
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

  getRules() {
    this.landaService.DataGet('/m_rules/index', {}).subscribe((res: any) => {
      this.listRules = res.data.list;
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

  restore(val) {
    this.landaService.DataPost('/m_pengguna/restore', { id: val.id }).subscribe((res: any) => {
      if (res.status_code === 200) {
        this.landaService.alertSuccess("Berhasil", "Data telah dikembalikan");
        this.reloadDataTable();
      } else {
        this.landaService.alertError("Mohon maaf", res.errors);
      }
    });
  }

  changeIsTrash() {
    this.reloadDataTable();
  }

  hapusPermanen(val) {
    Swal.fire({
      title: "Apakah anda yakin ?",
      text: "Menghapus data akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_pengguna/delete_permanen", { id: val.id })
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data telah dihapus !"
              );
              this.reloadDataTable();
            } else {
              this.landaService.alertError("Mohon Maaf", res.errors);
            }
          });
      }
    });
  }
}
