import {Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { ActivatedRoute, Router } from '@angular/router';
import {MeteorObservable} from "meteor-rxjs";
import {Categories} from '../../../../both/collections/categories.collection';
import * as funcs from "../../../../both/functions/common";
import {Observable} from "rxjs/Observable";
import { DataTableSource } from '../../../../both/classes/data-table';
import * as systemConfig from '../../../../both/config/systemConfig';
import {PageResolver} from "../../resolvers/PageResolver";

@Component({
  selector: 'inventory-category',
  template: `
    <page-header [(pageHeaderInput)]="pageHeader"></page-header>
    <mat-card>
      <div style="height: 50px">
        <div class="viewAll float-left" style="margin: 3px;" *ngFor="let user of activeUsers" [style.backgroundColor]="user.personalColor">
          {{user.firstName.substr(0, 1).toUpperCase()}}{{user.lastName.substr(0, 1).toUpperCase()}}
        </div>
      </div>
      <mat-tab-group *ngIf="category" class="p-10">
        <mat-tab label="Info">
          <div fxLayout="row wrap">
            <div fxFlex="">
              <div class="p-20">
                <mat-slide-toggle
                    [checked]="category.includeSalesReport"
                    (change)="change('includeSalesReport')"
                    labelPosition="before"
                >
                  Include on Sales Report
                </mat-slide-toggle>
                <br>
                <br>
                <mat-slide-toggle
                    [checked]="category.includeBudgetReport"
                    (change)="change('includeBudgetReport')"
                    labelPosition="before"
                >
                  Include on Budget Report
                </mat-slide-toggle>
                <br>
                <br>

                <mat-slide-toggle
                    [checked]="category.allowCustomerContract"
                    (change)="change('allowCustomerContract')"
                    labelPosition="before"
                    color="primary"
                >
                  Allow Customer Contract
                </mat-slide-toggle>
                <br>
                <br>
                <mat-slide-toggle
                    [checked]="category.allowCustomerQuote"
                    (change)="change('allowCustomerQuote')"
                    labelPosition="before"
                    color="primary"
                >
                  Allow Customer Quote
                </mat-slide-toggle>
              </div>
            </div>
            <div fxFlex="70" class="p-20">
              <div class="sales_widget">
                
              </div>
            </div>
          </div>
          
        </mat-tab>
        <mat-tab label="Contracts">
          <div>
            <div fxLayout="row">
              <!--<mat-table *ngIf="state.isDeveloper" #table1 fxFlex="" [dataSource]="activeUsersDataSource">-->
                <!--&lt;!&ndash; ID Column &ndash;&gt;-->
                <!--<div *ngFor="let column of userColumns">-->
                  <!--<ng-container matColumnDef="{{column.prop}}" style="cursor: pointer">-->
                    <!--<mat-header-cell *matHeaderCellDef> {{column.name}}</mat-header-cell>-->
                    <!--<mat-cell *matCellDef="let row">{{row[column.prop]}}</mat-cell>-->
                  <!--</ng-container>-->
                <!--</div>-->
                <!--<mat-header-row *matHeaderRowDef="displayedUserColumns"></mat-header-row>-->
                <!--<mat-row *matRowDef="let row; columns: displayedUserColumns;"></mat-row>-->
              <!--</mat-table>-->
            </div>
            <br>
            <div fxLayout="row" fxLayout.xs="column">
              <div fxFlex="45" fxFlex.xs="100">
                <mat-input-container fxFlex="" class="mr-20">
                  <input matInput placeholder="Level 1 %" min="0" type="number" [ngModel]="category.priceLevel1Percent" (change)="onPercentageChange('priceLevel1Percent', $event)">
                </mat-input-container>
                <mat-input-container fxFlex="" class="mr-20">
                  <input matInput placeholder="Level 2 %" min="0" type="number" [ngModel]="category.priceLevel2Percent" (change)="onPercentageChange('priceLevel2Percent', $event)">
                </mat-input-container>
                <mat-input-container fxFlex="" class="mr-20">
                  <input matInput placeholder="Level 3 %" min="0" type="number" [ngModel]="category.priceLevel3Percent" (change)="onPercentageChange('priceLevel3Percent', $event)">
                </mat-input-container>
                <mat-input-container fxFlex="" class="mr-20">
                  <input matInput placeholder="Level 4 %" min="0" type="number" [ngModel]="category.priceLevel4Percent" (change)="onPercentageChange('priceLevel4Percent', $event)">
                </mat-input-container>
              </div>
              <div fxFlex="55" fxFlex.xs="100">
                <!--<year-select></year-select>-->
                <mat-form-field>
                  <mat-select placeholder="Year To Date:" name="year" [(ngModel)]="selectedYear" (change)="updateYear($event.value)">
                    <mat-option *ngFor="let year of years" [value]="year">
                      {{year}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <normal-table [rows]="normalTableData.rows" [columns]="normalTableData.columns"></normal-table>
              </div>
            </div>
            
          </div>
          
          <div *ngIf="documentId">
            <system-lookup [lookupName]="'manageCategoryProducts'" [(config)]="config" (onSelected)="onSelect($event)" [(documentId)]="documentId" [(data)]="data" [(filterConditions)]="filterConditions"></system-lookup>
          </div>

        </mat-tab>
      </mat-tab-group>
    </mat-card>
  `,
  styleUrls: ['inventory.scss']
})

export class InventoryCategoryPage implements OnInit, OnDestroy {

  activeUsers = [];
  test: '';
  config = {
    isReactiveUpdate: false,
    enableMultipleUsersUpdate: true
  };
  state:any = {
    isDeveloper: false
  };
  pageHeader: string;
  subscription: Subscription;
  category: any = {};
  documentId: string;
  systemLog: any;
  columns = [];
  userColumns = [];
  selectedYear: number = new Date().getFullYear();
  years = systemConfig.years;
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true,
    gt: new Date()
  };
  dataSource: DataTableSource | null;
  activeUsersDataSource: DataTableSource | null;
  displayedColumns = [];
  displayedUserColumns = [];
  normalTableData: any;

  constructor(private route: ActivatedRoute, private _router: Router) {}

  navigateStartYear() {
    this._router.navigate([], {queryParams: {"url.startYear": this.selectedYear, "url.endYear": this.selectedYear + 1}, queryParamsHandling: 'merge'})
  }

  ngOnInit() {
    this.onInit();

    this.normalTableData = {
      columns:[],
      rows: []
    };

    this.normalTableData.columns = [
      {
        prop: 'year',
        label: 'Year',
      }, {
        prop: 'units',
        label: 'Units',
        cellTemplate: 'number'
      },
      {
        prop: 'revenue',
        label: 'Revenue',
        cellTemplate: 'currency'
      },
      {
        prop: 'cost',
        label: 'Cost',
        cellTemplate: 'currency'
      },
      {
        prop: 'gp',
        label: 'GP',
        cellTemplate: 'percent'
      },
      {
        prop: 'net',
        label: 'Net',
        cellTemplate: 'currency'
      }
    ];
    this.normalTableData.rows = [];


    this.columns = [
      {
        prop: 'year',
        name: 'Year'
      }, {
        prop: 'units',
        name: 'Units',
        cellTemplate: 'qtyTmpl'
      },
      {
        prop: 'revenue',
        name: 'Revenue',
        cellTemplate: 'currencyTmpl'
      },
      {
        prop: 'cost',
        name: 'Cost',
        cellTemplate: "currencyTmpl"
      },
      {
        prop: 'gp',
        name: 'GP',
        cellTemplate: "percentTmpl"
      },
      {
        prop: 'net',
        name: 'Net',
        cellTemplate: 'currencyTmpl'
      }
    ];

    this.displayedColumns = ['year', 'units', 'revenue', 'cost', 'gp', 'net'];
    this.getActiveUsers();
  }

  async getSystemLog() {
    const query = {sessionId: localStorage.getItem('sessionId')};
    const options = {fields: {sessionId: 1, createdUserId: 1}};
    this.systemLog = PageResolver.systemLog;
  }

  async funcIsDeveloper() {
    this.state.isDeveloper = PageResolver.isDeveloper;
    return PageResolver.isDeveloper;
  }

  async onInit() {
    let queryParams = await funcs.callbackToPromise(this.route.queryParams);

    if (!('startYear' in queryParams)) {
      this.navigateStartYear();
    }

    let params = await funcs.callbackToPromise(this.route.params);
    this.documentId = params['documentId'];
    // let obj = await funcs.callbackToPromise(this.route.queryParams);

    this.route.queryParams.subscribe((params) => {
      this.setYear(params);
    });

    this.funcIsDeveloper();

    const subscription = MeteorObservable.subscribe('categories', {_id: this.documentId});
    const autorun = MeteorObservable.autorun();

    this.subscription = Observable.merge(subscription, autorun).subscribe(() => {
      let doc = Categories.collection.findOne(this.documentId);
      if (doc) {
        this.pageHeader = 'Product Lines > ' + doc.name + ' - ' + doc.description;
        this.category = doc;
        Object.assign(this.data, {category: doc});
      }
    });
    this.getSystemLog();
  }

  setYear(params) {
    let url:any = funcs.parseUrlParams(params);

    Object.keys(url).forEach(key => {
      if (key == 'url.startYear') {
        this.selectedYear = url[key];
      }
    });
    const years = [this.selectedYear, this.selectedYear-1];

    this.normalTableData.rows = [];

    years.forEach(async(year=2017) => {
      const result:any = await funcs.getCategorySales(year, this.documentId);

      let row:any = [];
      if (result.length > 0) {
        row = [year,
          result[0].units,
          Number(result[0].revenue.toFixed(2)),
          Number(result[0].cost.toFixed(2)),
          result[0].gp,
          Number(result[0].net.toFixed(2))];
      } else {
        row = [year, 0, 0, 0, 0, 0];
      }
      this.normalTableData.rows.push(row);
    })
  }

  updateYear(params) {
    let url:any = funcs.parseUrlParams(params);

    Object.keys(url).forEach(key => {
      if (key == 'url.startYear') {
        this.selectedYear = url[key];
      }
    });
    this.navigateStartYear();
  }

  getActiveUsers() {
    this.userColumns = [
      {
        prop: 'firstName',
        name: 'First Name'
      },
      {
        prop: 'idle',
        name: 'Idle'
      },
      {
        prop: 'editable',
        name: 'Editable'
      },
      {
        prop: 'lastActivity',
        name: 'Last Activity'
      },
      {
        prop: 'landTime',
        name: 'Land Time'
      }
    ];
    this.displayedUserColumns = ['firstName', 'idle', 'editable', 'lastActivity', 'landTime'];

    // userstatus
    // const sub = MeteorObservable.subscribe('userStatus',
    //   {
    //     'status.online': true
    //   }
    // );
    // const autorun1 = MeteorObservable.autorun();
    // Observable.merge(sub, autorun1).subscribe(async (res) => {
    //
    //   Meteor.users.find({"status.connections.pathname": window.location.pathname}, {fields: {"status.connections": 1}}).fetch();
    //   let allConnections:any = await funcs.getPageConnections(window.location.pathname);
    //   this.activeUsers = allConnections;
    //
    //   // let isEditableSet = false;
    //
    //   if (this.activeUsers.length > 0 ) {
    //     const database = new BehaviorSubject<any[]>([]);
    //     this.activeUsers.forEach(async (user) => {
    //       const copiedData = database.value.slice();
    //       copiedData.push(user);
    //       database.next(copiedData);
    //     });
    //     this.activeUsersDataSource = new DataTableSource(database);
    //   }
    // });
  }

  async onPercentageChange(field, event) {
    let query = {
      _id: this.documentId
    };
    let update = {
      $set: {
        [field]: parseFloat(event.target.value)
      }
    };
    await funcs.update('categories', query, update);
    let logMessage = 'Update ' + field + ' to ' + event.target.value + ' from ' + this.category[field];

    let action = {
      documentId: this.documentId,
      collectionName: 'categories',
      document: this.category.name,
      type: 'update',
      field: field,
      log: logMessage,
      date: new Date(),
      value: event.target.value,
      previousValue: this.category[field]
    };
    this.log(action);
  }

  log(action) {
    let query = {
      _id: this.systemLog._id
    };
    let update = {
      $push: {
        actions: action
      }
    };

    funcs.update('systemLogs', query, update);
  }

  change(field) {
    let query = {_id: this.documentId};
    let update = {$set: {[field]: !this.category[field]}};
    funcs.update('categories', query, update);
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}


