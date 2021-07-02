import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { LandaService } from 'src/app/core/services/landa.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-m-supplier',
  templateUrl: './m-supplier.component.html',
  styleUrls: ['./m-supplier.component.scss']
})
export class MSupplierComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: DataTables.Settings;
  breadCrumbItems: Array<{}>;
  pageTitle: string;
  isView: boolean;
  isEdit: boolean;
  isTrash: boolean;
  listStatus: any;
  showForm: boolean;
  modelParam: { nama, kode };
  model: any = {};

  listData: any;
  constructor(private landaService: LandaService) { }

  ngOnInit(): void {
    this.pageTitle = "Supplier";
    this.breadCrumbItems = [
      {
        label: "Master",
      },
      {
        label: "Supplier",
        active: true,
      },
    ];
    this.modelParam = {
      nama: "",
      kode: ''
    };
    this.getData();
    this.empty();
    this.listStatus = [
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
          this.landaService.DataGet('/m_supplier/trash', {}).subscribe((res: any) => {
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
            .DataGet("/m_supplier/index", params)
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
    this.model = {
      nama: "",
    };
    this.getData();
  }

  index() {
    this.showForm = !this.showForm;
    this.pageTitle = "Data Supplier";
    this.getData();
    this.empty();
    this.isView = false;
    this.isEdit = false;
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Tambah Data Supplier";
    this.isView = false;
    this.isEdit = false;
    this.model.kode = `SP${this.listData.length + 1}`;
  }

  edit(val) {
    this.showForm = !this.showForm;
    this.pageTitle = "Supplier : " + val.nama;
    this.model = val;
    this.isView = false;
    this.isEdit = true;
  }

  view(val) {
    this.showForm = !this.showForm;
    this.pageTitle = "Supplier : " + val.nama;
    this.model = val;
    this.isView = true;
  }

  save() {
    const final = Object.assign(this.model);
    this.landaService.DataPost("/m_supplier/save", final).subscribe((res: any) => {
      if (res.status_code === 200) {
        this.landaService.alertSuccess("Berhasil", "Data Supplier telah disimpan!");
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
      text: "Menghapus data Supplier akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_supplier/delete", data)
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data Supplier telah dihapus !"
              );
              this.reloadDataTable();
            } else {
              this.landaService.alertError("Mohon Maaf", res.errors);
            }
          });
      }
    });
  }

  restore(val) {
    this.landaService.DataPost('/m_supplier/restore', { id: val.id }).subscribe((res: any) => {
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
      text: "Menghapus data Supplier akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_supplier/delete_permanen", { id: val.id })
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data Supplier telah dihapus !"
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
