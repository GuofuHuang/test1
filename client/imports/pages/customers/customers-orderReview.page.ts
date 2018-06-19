import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, Params, ActivatedRoute } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import { EventEmitterService } from "../../services";
import { PageResolver } from "../../resolvers/PageResolver";
import * as pdf from '../../../../both/functions/pdfReports';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'customers-orderReview',
  templateUrl: 'customers-orderReview.page.html',
  styleUrls: ['customers-orderReview.page.scss'],
})

export class CustomersOrderReviewPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  sub: Subscription;
  filterConditions: any;
  documentId: string;
  order: any = {};

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      MeteorObservable.call('findOne', 'customerOrders', {
        _id: params['id']
      }).subscribe(order => {
        this.documentId = params['id'];
        this.order = order;
        MeteorObservable.call('findOne', 'customers', { _id: this.order.customerId}, {}).subscribe((res: any) => {
          this.order['customerName'] = res.name;
        })
        this.getOrderTotal();
      })
    });
    this.hookEvents();
  }

  getOrderTotal(){
    let orderTotal = 0;
    let lineItems = this.order.lineItems;

    lineItems.forEach(lineItem => {
      orderTotal += lineItem.total;
    });
    this.order['orderTotal'] = orderTotal;
  }

  pdf() {
    console.log(this.order);
    this.order['docTitle'] = 'Sales Order'
    let docDefinition = pdf.invoiceOrOrderPdf(this.order);
    pdfMake.createPdf(docDefinition).open();
  }

   hookEvents() {
    let events = [];
    let pageRoute = PageResolver.getCurrentPageRoute();
    if (pageRoute.data && 'buttons' in pageRoute.data) {
      pageRoute.data.buttons.forEach(button => {
        if ('eventName' in button) {
          events.push(button.eventName);
        }
      })
    }
    if (events.length > 0) {
      this.sub = EventEmitterService.Events.subscribe(async (eventName) => {
        switch (eventName) {
          case 'generatePDF':
            this.pdf();
            break;
          default:
            break;
        }
      })
    }
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  select(e) {

  }

  reducers(action) {
    switch (action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

}
