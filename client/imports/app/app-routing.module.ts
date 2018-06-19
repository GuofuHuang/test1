import { NgModule }       from '@angular/core';
import { RouterModule }   from '@angular/router';

import {LoginComponent} from "../modules/shared-module/login/login.component";
import {SignupComponent} from "../modules/shared-module/signup/signup.component";
import {PageResolver} from "../resolvers/PageResolver";
import {GroupsPermissionsService} from "../services";
import {DashboardPage} from "../pages/dashboard/dashboard.page";

import {CanActivateTeam} from "../services/CanActivateTeam";
import {CanActivateDashboard} from "../services/CanActivateDashboard";
import {TodoListComponent} from "./todo-list/todo-list.component";

const resolve = {
  pageData: PageResolver,
  groupsPermissions: GroupsPermissionsService
}

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: 'login', component: LoginComponent,
      },
      {
        path: 'signup', component: SignupComponent,
      },
      {
        path: 'todoList',
        component: TodoListComponent
      },
      {
        path: 'todoAdd',
        loadChildren: "todo-add/todo-add.module#TodoAddModule",
      },
      {
        path: '', component: DashboardPage,
        resolve,
        canActivate: [CanActivateDashboard],
        children: [
          { path: '', redirectTo: 'customers/meetings', pathMatch: 'full'},
          { path: 'admin', loadChildren: "../pages/admin/admin.module#AdminModule", canActivate: [CanActivateTeam], resolve },
          { path: 'customers', loadChildren: "../pages/customers/customers.module#CustomersModule", canActivate: [CanActivateTeam], resolve },
          { path: 'developer', loadChildren: "../pages/developer/developer.module#DeveloperModule", canActivate: [CanActivateTeam], resolve },
          { path: 'designer', loadChildren: "../pages/designer/designer.module#DesignerModule", canActivate: [CanActivateTeam], resolve },
          { path: 'executive', loadChildren: "../pages/executive/executive.module#ExecutiveModule", canActivate: [CanActivateTeam], resolve },
          { path: 'inventory', loadChildren: "../pages/inventory/inventory.module#InventoryModule", canActivate: [CanActivateTeam], resolve },
        ]
      },
      {
        path: '**', redirectTo: 'customers'
      }
    ])
  ],
  exports: [ RouterModule ] // re-export the module declarations
})
export class AppRoutingModule { };