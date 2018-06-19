import {NgModule} from '@angular/core';

import {routing, ROUTES_PROVIDERS} from './executive.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {CalendarModule} from 'angular-calendar';
import {DpDatePickerModule} from 'ng2-date-picker';
import {HttpClientModule} from '@angular/common/http';

import {EXECUTIVE_DECLARATIONS} from "./index";
import {ExecutiveService} from "./executive.service";
import { ExecutiveDirective }          from './executive.directive';


@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    HttpClientModule,
  ],
  providers: [ ExecutiveService],
  declarations: [EXECUTIVE_DECLARATIONS, ExecutiveDirective],
  entryComponents: [EXECUTIVE_DECLARATIONS]
})
export class ExecutiveModule {

}
