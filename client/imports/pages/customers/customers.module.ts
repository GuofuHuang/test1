import { NgModule } from '@angular/core';

import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import { CalendarModule } from 'angular-calendar';
import {DpDatePickerModule} from 'ng2-date-picker';
// import { NguiMapModule } from '@ngui/map';
import {SimpleNotificationsModule} from "angular2-notifications";

import { CustomersService } from "./customers.service";
import { SERVICE_PROVIDERS } from "../../services";
import {CUSTOMERS_DECLARATIONS} from "./index";
import {TodoAddComponent} from "./todo-add.component";

import {CustomersMeetingsCreateComponent} from "./customers-meetings-create.component";
import {CustomersMeetingsPage} from "./customers-meetings.page";
import {CustomersRoutingModule} from "./customers.routing.module";
// import { CustomersComponent } from 'customers.component';

@NgModule({
  imports: [
    SharedModule,
    SimpleNotificationsModule.forRoot(),
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    CustomersRoutingModule
    // routing,
    // RouterModule.forChild([
    //   { path: '', component: CustomersMeetingsPage },
    //   { path: 'meetings', component: CustomersMeetingsPage },
    //   { path: 'test', component: TodoAddComponent }
    // ])
  ],
  declarations: [CUSTOMERS_DECLARATIONS],
  providers: [CustomersService, SERVICE_PROVIDERS]
})
export class CustomersModule {}
