import { Component, OnInit, ViewChild } from "@angular/core";
import { DataTableDirective } from "angular-datatables";
import * as moment from "moment";
import { LandaService } from "src/app/core/services/landa.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-l-pembelian",
  templateUrl: "./l-pembelian.component.html",
  styleUrls: ["./l-pembelian.component.scss"],
})
export class LPembelianComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtInstance: Promise<DataTables.Api>;
  dtOptions: DataTables.Settings;
  breadCrumbItems: Array<{}>;
  pageTitle: string;
  isView: boolean;
  isEdit: boolean;
  is_tampilkan: boolean;
  showForm: boolean;
  modelParam: { supplier };
  model: any = {};
  daterange: any = {};
  listSupplier: any;
  listPembelian: any;
  jumlahPembelian: any;
  data: any;
  apiURL = environment.apiURL;
  options: any = {
    locale: { format: "YYYY-MM-DD" },
    alwaysShowCalendars: false,
  };

  constructor(private landaService: LandaService) { }

  ngOnInit(): void {
    this.pageTitle = "Laporan Pembelian";
    this.breadCrumbItems = [
      {
        label: "Transaksi",
      },
      {
        label: "Laporan",
        activate: true,
      },
    ];
    this.modelParam = {
      supplier: "",
    };
    this.listSupplier = [];
    this.data = [];
    this.jumlahPembelian = 0;
    this.empty();
    this.tampil(0, 0);
  }

  index() {
    this.empty();
    this.showForm = !this.showForm;
    this.pageTitle = "Laporan";
    this.isView = false;
    this.isEdit = false;
    this.tampil(0, 0);
  }

  reloadDataTable() {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.draw();
    });
  }

  selectedDate(value: any, datepicker?: any) {
    datepicker.start = value.start;
    datepicker.end = value.end;
    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;
  }

  tampil(is_export, is_print) {
    const data = {
      periode_mulai: "null",
      periode_selesai: "null",
      is_export,
      is_print,
    };
    data.periode_mulai = moment(this.daterange.start).format("YYYY-MM-DD");
    data.periode_selesai = moment(this.daterange.end).format("YYYY-MM-DD");
    if (is_export === 1 || is_print === 1) {
      window.open(
        this.apiURL + "/l_pembelian/index?" + $.param(data),
        "_blank"
      );
      return;
    }
    this.landaService
      .DataGet("/l_pembelian/index", data)
      .subscribe((res: any) => {
        if (res.status_code === 200) {
          this.listPembelian = res.data.list;
          this.is_tampilkan = true;
          this.model.total = res.data.data_atas.total_bawah;
        } else {
          this.is_tampilkan = false;
        }
      });
  }

  empty() {
    this.model = {};
  }
}
