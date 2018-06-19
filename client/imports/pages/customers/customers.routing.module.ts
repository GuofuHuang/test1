import { NgModule }       from '@angular/core';
import { RouterModule }   from '@angular/router';
import {CustomersMeetingsPage} from "./customers-meetings.page";
import {CustomersContractsPage} from "./customers-contracts.page";
import {CustomersContractsCopyPage} from "./customers-contracts-copy.page";
import {CustomersQuotesPage} from "./customers-quotes.page";
import {CustomersCreateQuotePage} from "./customers-create-quote.page";
import {CustomersQuoteReviewPage} from "./customers-quoteReview.page";
import {CustomersMeetingsCreateComponent} from "./customers-meetings-create.component";
import {CustomersInquiryPage} from "./customers-inquiry.page";
import {CustomersOrdersPage} from "./customers-orders.page";
import {CustomersOrderReviewPage} from "./customers-orderReview.page";
import {CustomersInvoicesPage} from "./customers-invoices.page";
import {CustomersInvoiceReviewPage} from "./customers-invoiceReview.page";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: 'contracts', component: CustomersContractsPage },
      { path: 'contracts/copy', component: CustomersContractsCopyPage },
      { path: 'quotes', component: CustomersQuotesPage },
      { path: 'quotes/create', component: CustomersCreateQuotePage },
      { path: 'quotes/:documentId', component: CustomersQuoteReviewPage },
      {
        path: 'meetings', component: CustomersMeetingsPage,
      },
      { path: 'meetings/create', component: CustomersMeetingsCreateComponent },
      { path: 'meetings/:meetingId', component: CustomersMeetingsCreateComponent },
      { path: 'inquiry', component: CustomersInquiryPage },
      { path: 'orders', component: CustomersOrdersPage },
      { path: 'orders/:id', component: CustomersOrderReviewPage },
      { path: 'invoices', component: CustomersInvoicesPage },
      { path: 'invoices/:id', component: CustomersInvoiceReviewPage },
    ])
  ],
  exports: [ RouterModule ] // re-export the module declarations
})
export class CustomersRoutingModule { };

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