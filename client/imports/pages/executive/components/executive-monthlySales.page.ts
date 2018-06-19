import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../both/functions/common';
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'executive-monthlySales',
  template: `
      <mat-card class='fullHeight'>
        <h2>Sales Dashboard (Monthly)</h2>
        <hr>
        <div style="overflow-x:auto;">
          <table id='tables' *ngIf="!loading">
            <tr>
              <th class="rowHead"></th>
              <th *ngFor="let header of horizontalHeadersMonth" class="col">{{header}}</th>
            </tr>
            <tr *ngFor="let row of rows">
              <th class="rowHead">{{row.sideHeader.title}}</th>
                <td class='alignRight'>{{row.thisMonth}}</td>
                <td class='alignRight'>{{row.thisMonthLastYear}}</td>
                <td class='alignRight'>{{row.thisWholeMonthLastYear}}</td>
            </tr>
          </table>
          <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
        </div>
      </mat-card>
  `,
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveMonthlySalesPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  loading: boolean = true;
  rows = [];
  horizontalHeadersMonth = [
    'This Month (To Date)',
    'This Month Last Year (To Date)',
    'This Month Last Year (All Month)',
  ];
  // rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
  }

  ngOnInit() {
    this.init();
    this.getSalesDashBoardInfo();
  }   

  async getSalesDashBoardInfo() {
    let sales = {};
    let cost = {};
    let invoices = {};
    let profit = {};
    let profitPercent = {};
    let rows = [
      sales, cost, profit, profitPercent, invoices,
    ]
    let currentMonthRange = {
      gte: new Date(moment().startOf('month').format()),
      lte: new Date()
    }
    let lastYearMonthRange = {
      gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment().subtract(1, 'years').format())
    }
    let lastYearWholeMonthRange = {
      gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment().endOf('month').subtract(1, 'years').format())
    }

    sales['sideHeader'] = { title: 'Sales', type: 'dollar' };
    sales['thisMonth'] = await funcs.getTotalMonthSales(currentMonthRange);
    sales['thisMonthLastYear'] = await funcs.getTotalMonthSales(lastYearMonthRange);
    sales['thisWholeMonthLastYear'] = await funcs.getTotalMonthSales(lastYearWholeMonthRange);

    cost['sideHeader'] = { title: 'Cost', type: 'dollar' };
    cost['thisMonth'] = await funcs.getTotalMonthCost(currentMonthRange);
    cost['thisMonthLastYear'] = await funcs.getTotalMonthCost(lastYearMonthRange);
    cost['thisWholeMonthLastYear'] = await funcs.getTotalMonthCost(lastYearWholeMonthRange);

    // (condition) ? true : false
    invoices['sideHeader'] = { title: 'Invoices', type: 'number' };
    invoices['thisMonth'] = await funcs.countInvoices(currentMonthRange);
    invoices['thisMonthLastYear'] = await funcs.countInvoices(lastYearMonthRange);
    invoices['thisWholeMonthLastYear'] = await funcs.countInvoices(lastYearWholeMonthRange);

    // console.log(rows);
    rows.forEach(element => {
      this.fixObject(element);
    });

    profit['sideHeader'] = { title: 'Profit', type: 'dollar' };
    profit['thisMonth'] = sales['thisMonth'] - cost['thisMonth'];
    profit['thisMonthLastYear'] = sales['thisMonthLastYear'] - cost['thisMonthLastYear'];
    profit['thisWholeMonthLastYear'] = sales['thisWholeMonthLastYear'] - cost['thisWholeMonthLastYear'];

    profitPercent['sideHeader'] = { title: 'Profit %', type: 'percent' };
    profitPercent['thisMonth'] = (profit['thisMonth'] / sales['thisMonth'] * 100);
    profitPercent['thisMonthLastYear'] = (profit['thisMonthLastYear'] / sales['thisMonthLastYear'] * 100);
    profitPercent['thisWholeMonthLastYear'] = (profit['thisWholeMonthLastYear'] / sales['thisWholeMonthLastYear'] * 100);

    this.rows = rows;
    this.formatRows(rows);
  }

  fixObject(obj) {
    Object.keys(obj).forEach(function (key) {
      if (obj[key]['result']) {
        if (obj[key]['result'].length > 0) {
          if (obj[key]['result'][0]['total'] || obj[key]['result'][0]['total'] === 0) {
            obj[key] = obj[key]['result'][0]['total'] !== 0 ? obj[key]['result'][0]['total'] : 0.00;
          } else if (obj[key]['result'][0]['count'] || obj[key]['result'][0]['count'] === 0) {
            obj[key] = obj[key]['result'][0]['count'] !== 0 ? obj[key]['result'][0]['count'] : 0.00;
          }
        } else {
          obj[key] = 0.00;
        }
      }
    })
  }

  formatRows(rowArr) {
    for (var i = 0; i < rowArr.length; i++) {
      let obj = rowArr[i];
      let type = obj.sideHeader.type;
      Object.keys(obj).forEach(function (key) {
        if (key !== 'sideHeader') {
          switch (type) {
            case 'dollar':
              obj[key] = '$' + obj[key].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              break;
            case 'percent':
              obj[key] = isNaN(obj[key]) ? '0.00%' : obj[key].toFixed(2) + '%';
              break;
            default:
              obj[key] = obj[key]
          }
        }
      })
    }
    this.loading = false;
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
    // this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }
}
