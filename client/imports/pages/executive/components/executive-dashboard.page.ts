import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as _ from "underscore";

import { Router, Params, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'executive-dashboard',
  templateUrl: 'executive-dashboard.page.html',
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveDashboardPage implements OnInit{
  view: string = 'dashboard';
  pageHeader: string;
  objLocal: any = {};
  data: any = {};
  openOrdersReport: any = {};
  openOrdersTotals: any = {};
  freightReport: any = {};
  freightReportTotals: any = {};
  borrowingBase: any = {};
  borrowingBaseTotals: any = {};
  invoiceTotals90Days: any = {};
  inventory: any = {};
  lookupData: any = {};
  result: any;
  startOfMonth: Date;
  endOfMonth: Date;
  bankingBalanceAccounts = [];
  rows = [];
  horizontalHeadersMonth = [
    'This Month (To Date)',
    'This Month Last Year (To Date)',
    'This Month Last Year (All Month)',
  ];
  horizontalHeadersYear = [
    'This Year (To Date)',
    'Last Year (To Date)',
    'Last Year (All Year)',
  ];
  pageHeaders = {
    openOrders: 'Open Orders Totals',
    freightReport: 'Freight Report Totals',
    inventory: 'Inventory Valuation'
  }
  filterConditions: any;
  // @Input() data: any;

  constructor(private router: Router, private dialog: MatDialog, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    
  }
  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.pageHeader = (params['view']) ? this.pageHeaders[params['view']] : null;
      this.view = (params['view']) ? params['view'] : 'dashboard';
    })

    this.init();

  }


  changedKeys(o1, o2){
    let keys = _.union(_.keys(o1), _.keys(o2));
    return _.filter(keys, function (key) {
      // console.log(o1[key], o2[key]);
      if (!isNaN(o1[key]) || !isNaN(o2[key])) {
        return parseInt(o1[key]) !== parseInt(o2[key]);
      } else {
        return o1[key] !== o2[key];
      }
    })
  }

  clearUrlParams(){
    this.router.navigate([], {queryParams: {}});
  }

  lookupView(lookupData) {
    this.lookupData = lookupData;
    this.lookupData['keys'] = Object.keys(lookupData);
    // console.log(this.data);
    // console.log(this.lookupData);
    this.router.navigate([], { queryParams: this.lookupData, queryParamsHandling: 'merge', });
  }
  getRows(rows) {
    // console.log(rows);
    // this.calculateTotalsOpenOrders(rows);
    // this.rows = rows;
  }
  selectAccount(event) {
    if (this.view !== 'inventoryLastYear') {
      this.view = 'ledgerAccount';
      this.data.ledgerAccountId = event._id;
      this.router.navigate([], { queryParams: { view: this.view, ledgerId: event._id }, queryParamsHandling: 'merge' });
    }
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
}
