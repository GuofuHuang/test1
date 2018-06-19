import { NgModule }       from '@angular/core';
import { RouterModule }   from '@angular/router';

import {LoginComponent} from "../modules/shared-module/login/login.component";
import {SignupComponent} from "../modules/shared-module/signup/signup.component";
import {PageResolver} from "../resolvers/PageResolver";
import {GroupsPermissionsService} from "../services";
import {DashboardPage} from "../pages/dashboard/dashboard.page";
// import {DashboardPage} from "../pages/dashboard/dashboard.page";
// import {CustomersModule} from "../pages/customers/customers.module";
import {CanActivateTeam} from "../services/CanActivateTeam";
import {CanActivateDashboard} from "../services/CanActivateDashboard";
import {TodoListComponent} from "./todo-list/todo-list.component";
// import { DesignerModule } from "../pages/designer/designer.module";
// import { ExecutiveModule } from "../pages/executive/executive.module";
// import { InventoryModule } from "../pages/inventory/inventory.module";
// import { AdminModule } from "../pages/admin/admin.module";
// import { DeveloperModule } from "../pages/developer/developer.module";

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
      // { path: '', loadChildren: 'app/hero/hero.module#HeroModule'}
    ])
  ],
  exports: [ RouterModule ] // re-export the module declarations
})
export class AppRoutingModule { };

// export const ROUTES_PROVIDERS = [
//   {
//     provide: 'canActivateForLoggedIn',
//     useValue: () => !! Meteor.userId(),
//   }
// ];


//
// RouterModule.forRoot([
//   {
//     path: 'todoList',
//     component: TodoListComponent
//   },
//   {
//     path: 'todoAdd',
//     component: TodoAddComponent
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
/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/