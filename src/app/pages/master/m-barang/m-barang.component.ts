import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective } from 'angular-datatables';
import { LandaService } from 'src/app/core/services/landa.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-m-barang',
  templateUrl: './m-barang.component.html',
  styleUrls: ['./m-barang.component.scss']
})
export class MBarangComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: DataTables.Settings;
  breadCrumbItems: Array<{}>;
  pageTitle: string;
  isView: boolean;
  isEdit: boolean;
  showForm: boolean;
  modelParam: { nama, kode, m_supplier_id };
  model: any = {};
  listData: any;
  listSupplier: any;
  listSatuan: any;
  listTipeBarang: any;
  tipeModal: string;
  constructor(private landaService: LandaService,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.pageTitle = "barang";
    this.breadCrumbItems = [
      {
        label: "Master",
      },
      {
        label: "barang",
        active: true,
      },
    ];
    this.modelParam = {
      nama: "",
      kode: '',
      m_supplier_id: "",
    };
    this.getData();
    this.empty();
    this.getSup();
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
          .DataGet("/m_barang/index", params)
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
    this.pageTitle = "Data barang";
    this.getData();
    this.getSup();
    this.isView = false;
    this.isEdit = false;
  }

  create() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Tambah Data barang";
    this.isView = false;
    this.isEdit = false;
    this.getDataSelect();
  }

  edit(val) {
    this.showForm = !this.showForm;
    this.pageTitle = "barang : " + val.nama;
    this.model = val;
    this.isView = false;
    this.isEdit = true;
    this.getDataSelect();
  }

  view(val) {
    this.getDataSelect()
    this.showForm = !this.showForm;
    this.pageTitle = "barang : " + val.nama;
    this.model = val;
    this.isView = true;
  }

  save() {
    const final = Object.assign(this.model);
    this.landaService.DataPost("/m_barang/save", final).subscribe((res: any) => {
      if (res.status_code === 200) {
        this.landaService.alertSuccess("Berhasil", "Data barang telah disimpan!");
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
      text: "Menghapus data barang akan berpengaruh terhadap data lainnya",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Ya, Hapus data ini !",
    }).then((result) => {
      if (result.value) {
        this.landaService
          .DataPost("/m_barang/delete", data)
          .subscribe((res: any) => {
            if (res.status_code === 200) {
              this.landaService.alertSuccess(
                "Berhasil",
                "Data barang telah dihapus !"
              );
              this.reloadDataTable();
            } else {
              this.landaService.alertError("Mohon Maaf", res.errors);
            }
          });
      }
    });
  }

  selectedSup() {
    this.landaService.DataGet('/m_supplier/getsup', { id: this.model.m_supplier_id }).subscribe((res: any) => {
      this.model.kode = `${res.data.kode}BRG000${this.listData.length + 1}`
    })
  }

  getSup() {
    this.landaService.DataGet('/m_supplier/index', {}).subscribe((res: any) => {
      this.listSupplier = res.data.list;
    })
  }

  getDataSelect() {
    this.landaService.DataGet('/m_supplier/index', {}).subscribe((res: any) => {
      this.listSupplier = res.data.list;
    })
    this.landaService.DataGet('/m_tipe_barang/index', {}).subscribe((res: any) => {
      this.listTipeBarang = res.data.list;
    })
    this.landaService.DataGet('/m_satuan/index', {}).subscribe((res: any) => {
      this.listSatuan = res.data.list;
    })
  }

  tambahModal(modal, tipeModal) {
    this.modalService.open(modal, { size: "lg", backdrop: "static" });
    this.tipeModal = tipeModal;
  }

  simpan() {
    let url = this.tipeModal == 'tipe' ? '/m_tipe_barang/save' : '/m_satuan/save';
    this.landaService
      .DataPost(url, { nama: this.model[this.tipeModal] })
      .subscribe((res: any) => {
        if (res.status_code === 200) {
          this.landaService.alertSuccess("Berhasil", "Data telah dimasukkan");
          this.modalService.dismissAll();
          this.getDataSelect();
        } else {
          this.landaService.alertError("Mohon maaf", res.errors);
        }
      });
  }
}
