import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { LandaService } from 'src/app/core/services/landa.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-m-tipe-barang',
  templateUrl: './m-tipe-barang.component.html',
  styleUrls: ['./m-tipe-barang.component.scss']
})
export class MTipeBarangComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: DataTables.Settings;
  breadCrumbItems: Array<{}>;
  pageTitle: string;
  isView: boolean;
  isEdit: boolean;
  showForm: boolean;
  modelParam: { nama };
  model: any = {};

  listData: any;
  constructor(private landaService: LandaService) { }

  ngOnInit(): void {
    this.pageTitle = "Tipe Barang";
    this.breadCrumbItems = [
      {
        label: "Master",
      },
      {
        label: "Tipe Barang",
        active: true,
      },
    ];
    this.modelParam = {
      nama: "",
    };
    this.getData();
    this.empty();
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
        const params = {
          filter: JSON.stringify(this.modelParam),
          offset: dataTablesParameters.start,
          limit: dataTablesParameters.length,
        };
        this.landaService
          .DataGet("/m_tipe_barang/index", params)
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
    this.model = {
      nama: "",
    };
    this.getData();
  }

  index() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Data Tipe Barang";
    this.getData();
    this.isView = false;
    this.isEdit = false;
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Tambah Data Tipe Barang";
    this.isView = false;
    this.isEdit = false;
  }

  edit(val) {
    this.showForm = !this.showForm;
    this.pageTitle = "Tipe Barang : " + val.nama;
    this.model = val;
    this.isView = false;
    this.isEdit = true;
  }

  view(val) {
    this.showForm = !this.showForm;
    this.pageTitle = "Tipe Barang : " + val.nama;
    this.model = val;
    this.isView = true;
  }

  save() {
    const final = Object.assign(this.model);
    this.landaService.DataPost("/m_tipe_barang/save", final).subscribe((res: any) => {
      if (res.status_code === 200) {
        this.landaService.alertSuccess("Berhasil", "Data tipe barang telah disimpan!");
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
      text: "Menghapus data tipe barang akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_tipe_barang/delete", data)
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data tipe barang telah dihapus !"
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
