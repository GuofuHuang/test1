import { NgModule } from '@angular/core';
import { MaterialImportModule } from '../../app/material-import.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { SYSTEMLOOKUP_DECLARATIONS, DialogSelect } from './system-lookup';
import { FILTER_ENTRYCOMPONENTS } from './filter';
import { FILTERDIALOG_ENTRYCOMPONENTS } from './filterDialog';
import { CAlENDAR_DECLARATIONS } from './calendar';
import { DIALOG_ENTRYCOMPONENTS } from './dialog';
import { GroupByPipe } from './groupBy/group-by.pipe';
import { CalendarModule } from 'angular-calendar';
import { DpDatePickerModule } from 'ng2-date-picker';
import { PAGEHEADER_ENTRYCOMPONENTS } from './pageHeader';
import { FABBUTTON_DECLARATIONS } from './fabButton';
// import { PAGELOGS_ENTRYCOMPONENTS} from './page-logs';
import { NORMALTABLE_ENTRYCOMPONENTS} from './normal-table';
import { YearSelectComponent} from './year-select/year-select.component';
import { LoginComponent} from './login/login.component';
import { SignupComponent} from './signup/signup.component';
import { SidenavComponent} from './sidenav/sidenav.component';
import { USERDROPDOWN_CLERATIONS} from './user-dropdown';
import { SimpleNotificationsModule} from "angular2-notifications";
import {ObservablesService} from "../../services";
import { CollapseDirective } from '../../directives/collapse.component';

const declarations = [
  SYSTEMLOOKUP_DECLARATIONS,
  FILTER_ENTRYCOMPONENTS,
  DIALOG_ENTRYCOMPONENTS,
  CAlENDAR_DECLARATIONS,
  GroupByPipe,
  PAGEHEADER_ENTRYCOMPONENTS,
  FABBUTTON_DECLARATIONS,
  // PAGELOGS_ENTRYCOMPONENTS,
  NORMALTABLE_ENTRYCOMPONENTS,
  YearSelectComponent,
  LoginComponent,
  SignupComponent,
  SidenavComponent,
  CollapseDirective,
  USERDROPDOWN_CLERATIONS,
  FILTERDIALOG_ENTRYCOMPONENTS
];

@NgModule({
  imports: [
    CommonModule,
    SimpleNotificationsModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
  ],
  entryComponents: [
    DIALOG_ENTRYCOMPONENTS,
    DialogSelect
  ],
  declarations,
  providers: [ObservablesService],
  exports: declarations
})
export class SharedModule {}
