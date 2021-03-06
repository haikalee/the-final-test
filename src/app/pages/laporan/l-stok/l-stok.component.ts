import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import * as moment from 'moment';
import { LandaService } from 'src/app/core/services/landa.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-l-stok',
  templateUrl: './l-stok.component.html',
  styleUrls: ['./l-stok.component.scss']
})
export class LStokComponent implements OnInit {
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
  listStok: any;
  jumlahPembelian: any;
  data: any;
  apiURL = environment.apiURL;
  options: any = {
    locale: { format: "YYYY-MM-DD" },
    alwaysShowCalendars: false,
  };

  constructor(private landaService: LandaService) { }

  ngOnInit(): void {
    this.pageTitle = "Laporan Stok";
    this.breadCrumbItems = [
      {
        label: "Laporan",
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
    this.pageTitle = "Laporan Stok";
    this.isView = false;
    this.isEdit = false;
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
      is_export,
      is_print,
    };

    if (is_export === 1 || is_print === 1) {
      window.open(
        this.apiURL + "/l_stok/index?" + $.param(data),
        "_blank"
      );
      return;
    }

    this.landaService
      .DataGet("/l_stok/index", data)
      .subscribe((res: any) => {
        if (res.status_code === 200) {
          console.log(res.data);
          this.listStok = res.data;
          this.is_tampilkan = true;
        } else {
          this.is_tampilkan = false;
        }
      });
  }

  empty() {
    this.model = {};
  }
}
