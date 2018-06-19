import { Component } from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, Params, ActivatedRoute } from '@angular/router';
import * as pdf from '../../../../both/functions/pdfReports';
import { MeteorObservable } from "meteor-rxjs";
import { EventEmitterService } from "../../services";
import { PageResolver } from "../../resolvers/PageResolver";
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'customers-InvoiceReview',
  templateUrl: "customers-invoiceReview.page.html",
  styleUrls: ['customers-invoiceReview.page.scss'],
})

export class CustomersInvoiceReviewPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;
  sub: Subscription;
  invoice: any = {};

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      MeteorObservable.call('findOne', 'customerInvoices', {
        _id: params['id']
      }).subscribe(invoice => {
        this.documentId = params['id'];
        this.invoice = invoice;
        MeteorObservable.call('findOne', 'customers', { _id: this.invoice.customerId}, {}).subscribe((res: any) => {
          this.invoice['customerName'] = res.name;
        })
        this.getInvoiceTotal();
      })
    });
    this.hookEvents();
  }

    getInvoiceTotal(){
    let invoiceTotal = 0;
    let lineItems = this.invoice.lineItems;

    lineItems.forEach(lineItem => {
      invoiceTotal += lineItem.total;
    });
    this.invoice['invoiceTotal'] = invoiceTotal;
  }

  pdf(){
    this.invoice['docTitle'] = 'Invoice'
    let docDefinition = pdf.invoiceOrOrderPdf(this.invoice);
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
