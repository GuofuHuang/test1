import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import {LoginComponent} from "../modules/shared-module/login/login.component";
import {SharedModule} from "../modules/shared-module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialImportModule} from "./material-import.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CalendarModule} from "angular-calendar";
import {DpDatePickerModule} from "ng2-date-picker";
import {HttpClientModule} from "@angular/common/http";
import {SimpleNotificationsModule} from "angular2-notifications";
import {SignupComponent} from "../modules/shared-module/signup/signup.component";
// import {AppRoutingModule} from "./app-routing.module";
import {DASHBOARD_DECLARATIONS} from "../pages/dashboard";
import {CanActivateDashboard, CanActivateTeam, GroupsPermissionsService} from "../services";
import {PageResolver} from "../resolvers/PageResolver";
import {ModuleResolver} from "../resolvers/ModuleResolver";
import {AccessResolver} from "../resolvers/AccessResolver";
import {AppRoutingModule} from "./app-routing.module";
declare var module : any;
global['System'] = {
  import(path: string){
    return module.dynamicImport(path);
  }
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialImportModule,
    BrowserAnimationsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    HttpClientModule,
    SharedModule,
    SimpleNotificationsModule.forRoot(),
    AppRoutingModule
    // RouterModule.forRoot([
    //   {
    //     path: 'todoList',
    //     component: TodoListComponent
    //   },
    //   {
    //     path: 'login',
    //     component: LoginComponent
    //   },
    //   {
    //     path: 'todoAdd',
    //     loadChildren: "todo-add/todo-add.module#TodoAddModule",
    //   },
    //   // Home Page
    //   {
    //     path: '',
    //     redirectTo: '/todoList',
    //     pathMatch: 'full'
    //   },
    //   // 404 Page
    //   {
    //     path: '**',
    //     component: PageNotFoundComponent
    //   }
    // ])
  ],
  providers: [
    CanActivateTeam,
    CanActivateDashboard,
    PageResolver,
    ModuleResolver,
    AccessResolver,
    GroupsPermissionsService
  ],
  declarations: [
    AppComponent,
    DASHBOARD_DECLARATIONS,
    TodoListComponent,
    PageNotFoundComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
