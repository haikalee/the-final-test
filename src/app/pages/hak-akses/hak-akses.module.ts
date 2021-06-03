import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataTablesModule } from "angular-datatables";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UiSwitchModule } from "ngx-ui-switch";
import { ArchwizardModule } from "angular-archwizard";
import { NgxMaskModule, IConfig } from "ngx-mask";
import { Daterangepicker } from "ng2-daterangepicker";
import { CKEditorModule } from "ckeditor4-angular";

import {
  NgbAlertModule,
  NgbCarouselModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbProgressbarModule,
  NgbTooltipModule,
  NgbPopoverModule,
  NgbPaginationModule,
  NgbNavModule,
  NgbAccordionModule,
  NgbCollapseModule,
  NgbDatepickerModule,
  NgbModule,
  NgbModal
} from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { UIModule } from "../../layouts/shared/ui/ui.module";
import { HakAksesRoutingModule } from './hak-akses-routing.module';
import { HaAksesComponent } from './ha-akses/ha-akses.component';
import { HaUsersComponent } from './ha-users/ha-users.component';

export const options: Partial<IConfig> = {
  thousandSeparator: ".",
};

@NgModule({
  declarations: [HaAksesComponent, HaUsersComponent],
  imports: [
    CommonModule,
    HakAksesRoutingModule,
    FormsModule,
    UIModule,
    NgbAlertModule,
    NgbCarouselModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    NgbModalModule,
    NgbProgressbarModule,
    NgbTooltipModule,
    NgbPopoverModule,
    NgbPaginationModule,
    NgbNavModule,
    NgbAccordionModule,
    NgSelectModule,
    UiSwitchModule,
    NgbCollapseModule,
    NgbModule,
    ReactiveFormsModule,
    ArchwizardModule,
    DataTablesModule,
    Daterangepicker,
    CKEditorModule,
    NgxMaskModule.forRoot(options),
  ],
})
export class HakAksesModule { }
