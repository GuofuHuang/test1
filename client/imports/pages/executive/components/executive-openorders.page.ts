import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { parseAll, asyncGetLookupId, runAggregate, setObjectValue } from '../../../../../both/functions/common';
import * as funcs from '../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'executive-openorders',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Open Orders Totals</h2>
      <span style="float: right; cursor: pointer;">
        <i class="material-icons" (click)="changeView('openOrders')">exit_to_app</i>
        <i class="material-icons" (click)="pdf('openOrdersReport')">picture_as_pdf</i>
      </span>
      <hr style='clear: both;'>
      <div style="overflow-x:auto;">
        <table id='tables' *ngIf="!loading">
          <tr>
            <th class="rowHead">Open Sales</th>
            <td class="alignRight">{{openOrdersTotals.openSales | currency:'USD':'symbol':'2.2-2'}}</td>
          </tr>
          <tr>
            <th class="rowHead">This Month</th>
            <td class="alignRight">{{openOrdersTotals.currentMonth | currency:'USD':'symbol':'2.2-2'}}</td>
          </tr>
          <tr>
            <th class="rowHead">Open Backorders</th>
            <td class="alignRight">{{openOrdersTotals.backOrdered | currency:'USD':'symbol':'2.2-2'}}</td>
          </tr>
          <tr>
            <th class="rowHead">Open Future</th>
            <td class="alignRight">{{openOrdersTotals.futureOrders | currency:'USD':'symbol':'2.2-2'}}</td>
          </tr>
        </table>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
      </div>
    </mat-card>
  `,
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveOpenordersPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  openOrdersReport: any = {};
  openOrdersTotals: any = {};
  loading: boolean = true;
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    //openOrders
    let id = await asyncGetLookupId('openOrders');
    this.getOpenOrdersAggregate(id)
  }

  ngOnInit() {
    this.data.firstOfMonth = moment().startOf('month').format();
    this.data.endOfMonth = moment().endOf('month').format();
    this.init();
  }

  async getOpenOrdersAggregate(id) {
    let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
      this.openOrdersReport['lookup'] = lookup;
      let method = lookup['methods'][0]
      let parsed = parseAll(lookup['methods'][0].args, this.objLocal);
      let totalLogic = parseAll(lookup['totalLogic'], this.objLocal);
      let date;
      if ('datePaths' in method.args[0]) {
        method.args[0].datePaths.forEach(datePath => {
          if (datePath.indexOf('$gte') !== -1) {
            date = this.data.firstOfMonth
          } else if (datePath.indexOf('$lte') !== -1 || datePath.indexOf('$lt') !== -1) {
            date = this.data.endOfMonth
          }
          setObjectValue(parsed[0], datePath, new Date(date));
        })
      }

      let totalAggragate = parsed[0].concat(totalLogic[0])
      this.getOpenOrders('customerOrders', parsed[0], totalAggragate)
    });
  }

  async getOpenOrders(collection, pipeline, totalAggragate) {
    let result = await runAggregate(collection, pipeline);
    this.openOrdersReport['result'] = result['result'];

    let openOrdersTotals = {
      openSales: 0,
      currentMonth: 0,
      backOrdered: 0,
      futureOrders: 0,
      cogs: 0,
      grossProfit: 0,
      grossProfitPercentage: 0,
      orderTotal: 0,
    }

    let totalResults = await runAggregate(collection, totalAggragate);
    if (totalResults['result'].length > 0) {
      openOrdersTotals = totalResults['result'][0];
    }

    this.openOrdersTotals = openOrdersTotals;
    this.openOrdersReport['totals'] = openOrdersTotals;

    this.loading = false;
  }

  changeView(lookup) {
    let lookupData = this.data
    lookupData = Object.assign({
      view: 'openOrders',
      // lookup: 'openOrders',
    }, lookupData);
    this.lookupView.emit(lookupData);
  }    

  pdf(report) {
    let pdfInfo = this.openOrdersReport;
    let docDefinition: any = funcs.reportPdf(pdfInfo);
    pdfMake.createPdf(docDefinition).open();
  }

  getFilterConditions(action) {
    this.reducers(action);
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

  getRows(rows) {
    // console.log(rows);
    this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }
}
