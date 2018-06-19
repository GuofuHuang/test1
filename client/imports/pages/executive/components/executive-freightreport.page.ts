import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { parseAll, asyncGetLookupId, runAggregate, setObjectValue } from '../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import * as funcs from '../../../../../both/functions/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'executive-freightreport',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Freight Report Totals</h2>
        <span style="float: right; cursor: pointer;">
          <i class="material-icons" (click)="changeView('freightReport')">exit_to_app</i>
          <i class="material-icons" (click)="pdf('freightReport')">picture_as_pdf</i>
        </span>
        <hr style='clear: both;'>
        <div>
          <mat-form-field style='float: left; width: 49%;'>
            <input matInput [matDatepicker]="startPicker" [max]="date.endOfDay.value" (dateChange)="changeDay('start', $event)" [value]="date.startOfDay.value" placeholder="Start Date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field style='float: right; width: 49%;'>
            <input matInput [matDatepicker]="endPicker" [min]="date.startOfDay.value" (dateChange)="changeDay('end', $event)" [value]="date.endOfDay.value" placeholder="End Date">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          <br>
          <div style="overflow-x:auto; clear: both;">
            <table id='tables' *ngIf="!loading">
              <tr>
                <th class="rowHead">Invoice Total</th>
                <td class="alignRight">{{freightReportTotals.invoiceTotal | currency:'USD':'symbol':'2.2-2'}}</td>
              </tr>
              <tr>
                <th class="rowHead">COGS</th>
                <td class="alignRight">{{freightReportTotals.cogs | currency:'USD':'symbol':'2.2-2'}}</td>
              </tr>
              <tr>
                <th class="rowHead">Gross Profit</th>
                <td class="alignRight">{{freightReportTotals.grossProfit | currency:'USD':'symbol':'2.2-2'}}</td>
              </tr>
              <tr>
                <th class="rowHead">Gross Profit %</th>
                <td class="alignRight">{{freightReportTotals.grossProfitPercentage | number : '1.2-2'}}%</td>
              </tr>
              <tr>
                <th class="rowHead">Freight Cost</th>
                <td class="alignRight">{{freightReportTotals.freightCost | currency:'USD':'symbol':'2.2-2'}}</td>
              </tr>
              <tr>
                <th class="rowHead">Freight %</th>
                <td class="alignRight">{{freightReportTotals.freightCostPercentage | number : '1.2-2'}}%</td>
              </tr>
              <tr>
                <th class="rowHead">Net Profit</th>
                <td class="alignRight">{{freightReportTotals.netProfit | currency:'USD':'symbol':'2.2-2'}}</td>
              </tr>
              <tr>
                <th class="rowHead">Net Profit %</th>
                <td class="alignRight">{{freightReportTotals.netProfitPercentage | number : '1.2-2'}}%</td>
              </tr>
            </table>
            <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
          </div>
        </div>
      </mat-card>
  `,
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveFreightreportPage implements OnInit{

  @Input() data: any;
  today: any;
  date: any = {};
  filterConditions: any;
  objLocal: any = {};
  freightReport: any = {};
  freightReportTotals: any = {};
  loading: boolean = true;
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private route: ActivatedRoute) {}

  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();

    let id = await asyncGetLookupId('freightReport');
    this.getFreightReportAggregate(id)
  }

  ngOnInit() {
    this.data.beginningOfDay = moment(this.today).startOf('day').format();
    this.data.endOfDay = moment(this.today).endOf('day').format()
    this.today = new FormControl(new Date(this.data.beginningOfDay))
    this.date.startOfDay = new FormControl(new Date(this.data.beginningOfDay))
    this.date.endOfDay = new FormControl(new Date(this.data.endOfDay))
    this.init();
  }

  changeView(lookup) {
    let lookupData = this.data
    lookupData = Object.assign({
      view: 'freightReport',
      // lookup: 'freightReport',

    }, lookupData);
    this.lookupView.emit(lookupData);
  } 

  async getFreightReportAggregate(id) {
    let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
      this.freightReport['lookup'] = lookup;
      let method = lookup['methods'][0]
      let parsed = parseAll(lookup['methods'][0].args, this.objLocal);
      let totalLogic = parseAll(lookup['totalLogic'], this.objLocal);
      let date;
      if ('datePaths' in method.args[0]) {
        method.args[0].datePaths.forEach(datePath => {
          if (datePath.indexOf('$gte') !== -1) {
            date = this.data.beginningOfDay
          } else if (datePath.indexOf('$lte') !== -1) {
            date = this.data.endOfDay
          }
          setObjectValue(parsed[0], datePath, new Date(date));
        })
      }
      let totalAggragate = parsed[0].concat(totalLogic[0])
      this.getFreightReport('customerInvoices', parsed[0], totalAggragate)
    });
  }

  async getFreightReport(collection, pipeline, totalAggragate) {
    let result = await runAggregate(collection, pipeline);
    this.freightReport['result'] = result['result'];

    let freightReportTotals = {
      invoiceTotal: 0,
      cogs: 0,
      grossProfit: 0,
      grossProfitPercentage: 0,
      freightCost: 0,
      freightCostPercentage: 0,
      netProfit: 0,
      netProfitPercentage: 0,
    }

    let totalResults = await runAggregate(collection, totalAggragate);
    if (totalResults['result'].length > 0) {
      freightReportTotals = totalResults['result'][0];
    }

    this.freightReportTotals = freightReportTotals;
    this.freightReport['totals'] = freightReportTotals;
    this.loading = false;
  }

  async changeDay(input, event) {
    this.loading = true;
    switch (input) {
      case 'start':
      this.data.beginningOfDay = moment(event.value).startOf('day').format()
        break;
      case 'end':
      this.data.endOfDay = moment(event.value).endOf('day').format()
        break;
      default:
    }

    this.date.startOfDay = new FormControl(new Date(this.data.beginningOfDay))
    this.date.endOfDay = new FormControl(new Date(this.data.endOfDay))
    
    let id = await asyncGetLookupId('freightReport');
    this.getFreightReportAggregate(id)
  }

  pdf(report) {
    let pdfInfo = this.freightReport
    this.freightReport['date'] = this.data.beginningOfDay;;
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
  select(event) {
    this.router.navigate(['customers/invoices/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/invoices/' + event._id;
  }
}
