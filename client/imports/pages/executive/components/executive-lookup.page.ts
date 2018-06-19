import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {ActivatedRoute, Router, Params} from '@angular/router';
import * as _ from "underscore";

@Component({
  selector: 'executive-lookup',
  template: `
    <span *ngIf="data.view && !data.showSecondLookup">
      <filterBox-component (filter)="getFilterConditions($event)" [lookupName]="data.view"></filterBox-component>
      <system-lookup [lookupName]="data.view" (onSelected)="select($event)" (tableRows) ='getRows($event)' [(data)]="data" [(filterConditions)]="filterConditions"></system-lookup>
    </span>
    <span *ngIf="data.secondLookup && data.showSecondLookup">
      <filterBox-component (filter)="getFilterConditions($event)" [lookupName]="data.secondLookup"></filterBox-component>
      <system-lookup [lookupName]="data.secondLookup" (onSelected)="select($event)" (tableRows) ='getRows($event)' [(data)]="data" [(filterConditions)]="filterConditions"></system-lookup>
    </span>
  `,
  styleUrls: ['executive-dashboard.page.scss'],
})
// <filterBox-component(filter)="getFilterConditions($event)"[lookupName] = "'openOrders'" > </filterBox-component>
  // < system - lookup[lookupName]="'openOrders'"(tableRows) = 'getRows($event)'(onSelected) = "select($event)"[(data)] = "data"[(filterConditions)] = "filterConditions" > </system-lookup>
export class ExecutiveLookupPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  showSecondLookup: boolean = false;
  objLocal: any = {};
  openOrdersReport: any = {};
  openOrdersTotals: any = {};
  lookup: boolean = false;
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {

  }

  ngOnInit() {
    // this.data['keys'] = Object.keys(this.data);
    // console.log(this.data);
    this.activatedRoute.queryParams.subscribe((params: Params) => {

      let paramObj = params;
      // if (!params['keys']) {
      //   this.data['keys'] = Object.keys(this.data);
      //   console.log();
      // } else {
      //   this.data['keys'] = params['keys'];
      // }
      this.data['keys'] = params['keys'];
      let changedArr = this.changedKeys(this.data, paramObj)
      let dataChanged = _.intersection(changedArr, this.data['keys'])
      // console.log(changedArr, dataChanged);
      // console.log(changedArr, dataChanged);
      if (dataChanged.length > 0) {
        // console.log('inside');
        this.data = params;
        // console.log(this.data);
        if (params['view']) {
          // console.log(params['view']);
          Object.keys(params).forEach(key => {
            this.data = _.mapObject(params, function (val, key) {
              if (!isNaN(params[key])) {
                return parseInt(val);
              } else {
                return val;
              }
            });
          })
        }
      }
      if (!this.data.keys && !params['view']) {
        this.data.view = null;
      }
      // console.log(this.data);
    })
    this.init();  
  }

  changedKeys(o1, o2) {
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
    this.rows.emit(rows);
  }

  select(event) {
    switch (this.data.view) {
      case 'openOrders':
        this.router.navigate(['customers/orders/' + event['_id']]);
        break;
      case 'freightReport':
        this.router.navigate(['customers/invoices/' + event['_id']]);
        break;
      case 'inventory':
        let lookupData = { 
          view: 'ledgerAccount',
          secondLookup: this.data.secondLookup, 
          ledgerAccountId: event['_id'], 
          yearNumber: this.data.yearNumber,
          monthNumber: this.data.monthNumber,
          showSecondLookup: true,
          keys: this.data.keys
        }
      
        this.router.navigate([], { queryParams: lookupData});
        break;
      default:
    }
  }
}
