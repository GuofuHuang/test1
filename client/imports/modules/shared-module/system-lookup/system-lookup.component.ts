import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Session } from 'meteor/session';
import { Observable } from 'rxjs/Observable';
import { MatSort } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DataSource } from '@angular/cdk/collections';
import { AllCollections } from '../../../../../both/collections';

import * as funcs from '../../../../../both/functions/common';
import * as SystemConfig from '../../../../../both/config/systemConfig';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { NotificationsService } from 'angular2-notifications';
import { Random } from 'meteor/random';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

import { DialogComponent } from '../dialog/dialog.component';

import { LogService } from '../../../services/LogService';
import { UserService } from '../../../services/UserService';

import Dependency = Tracker.Dependency;
import { generateRegexWithKeywords, isEmptyObject } from '../../../../../both/functions/common';
import { PageResolver } from "../../../resolvers/PageResolver";

@Component({
  selector: 'system-lookup',
  templateUrl: 'system-lookup.component.html',
  styleUrls: ['system-lookup.component.scss'],
  providers: [LogService, UserService]

})

export class SystemLookupComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config: any = {
    isReactiveUpdate: true,
    enableMultipleUsersUpdate: true
  };
  @Input() lookupName: string;
  @Input() documentId: any;
  @Input() filterConditions: any = [];
  @Input() data: any;
  @Input() isModal: boolean = false;
  @Input() isWidget: boolean = false;
  @Output() onSelected = new EventEmitter<any>();
  @Output() aggregate = new EventEmitter<any>();
  @Output() tableRows = new EventEmitter<any>();
  @Output() isLoading = new EventEmitter<any>();
  @Output() _onMobileClick = new EventEmitter<any>();

  @ViewChild('filter') filter: ElementRef;
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  permissionStatus = [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
    { value: '', label: 'Not Configured' }
  ];

  methodsToBeRun = [];

  Device = Meteor['Device'];

  trackerAutoruns: any = [];
  url: string = '';
  showTable = false;
  displayedColumns = [];
  // displayedColumns = [];
  exampleDatabase: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  dataSource: ExampleDataSource | null;


  aggregateSortOption: {};
  aggregateSearchOption: {};

  systemLog: any;

  // component state
  state: any = {
    initRows: [],
    isDirty: false,
    actionsToBeUploaded: [],
    isSaveButtonEnabled: false,
    queryParams: {}
  };

  user: any = {
    status: {
      editable: false
    }
  };

  // datatable
  sortActive = '';
  sortDirection = '';
  autofocus = true;
  columns: any[] = []; // headers in the data table
  modalFilters: any[] = [];
  rows: any[] = [];
  returnable: boolean = false; //
  returnType: string; //
  returnData: string[]; // used to defined what data to be returned when selected
  selected: any[] = []; // current selected items
  oldSelected: any[] = []; // old selected items for the datatable
  dataTableOptions: any = {
    searchable: true
  }; // options for the datatable
  dataTable: any = {};
  count: number = 0; // count for the data table
  pageIndex: number = 0; // offset for the data table
  pageSize: number = 10; // limit for the data table
  skip: number = 0; // skip for the data table
  selectedIds: string[] = [];
  keywords: string = ''; // keywords to search the database
  isClick: boolean = false; // detect if the event is click event
  loading: boolean = true;
  needRefresh: boolean = false;
  selectedColumn: any = {};
  canRunMethod: false;

  firstInit: boolean = true;

  searchable: boolean = true;
  mainSub: Subscription;
  routeSub: Subscription;
  subscriptions: Subscription[] = []; // all subscription handles
  observeSubscriptions: Subscription[] = []; // all subscription handles
  subscribeSubscriptions = []; // subscription handles for field subscriptions in systemlookup
  autorunSubscriptions: Subscription[] = []; // subscription handles for field subscriptions in systemlookup
  systemLookup: any = {}; // current system lookup object
  tempSystemLookup: any = {}; // copy of current system lookup object
  objLocal: any = {}; // used to store variables data to be substitute for the params
  methods: any[] = []; // all functions
  methodArgs: any[] = []; // current method args
  method: any = {}; // current method
  hideDelete: boolean = false;
  showPdf: boolean = false;
  showSummary: boolean = false;
  totalObj: any;
  totalLogic: any;
  test: any;


  public options = SystemConfig.alertOptions;
  // Dependencies
  dep1 = new Dependency();
  findDep: Dependency = new Dependency(); // keywords dependency to invoke a search function
  aggregateDep: Dependency = new Dependency(); // keywords dependency to invoke a search function
  autoDep1: Dependency = new Dependency(); // keywords dependency to invoke a search function

  selectedLevelHeader: string;
  mobile: boolean;

  constructor(public dialog: MatDialog, private _service: NotificationsService, private router: Router, private route: ActivatedRoute) {
    this.user = Meteor.user();
    this.mobile = funcs.checkMobile();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 0);
  }

  // async functions
  asyncWaitSession() {
    return new Promise(resolve => {
      let parentTenantId = Session.get('parentTenantId');
      let tenantId = Session.get('tenantId');

      if (parentTenantId && tenantId) {
        resolve(true);
      }
    })
  }

  async asyncFunctions() {

    await this.asyncWaitSession();

    this.objLocal['data'] = this.data;
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    if (this.documentId) {
      this.objLocal.documentId = this.documentId;
    }

    let lookupId = await funcs.asyncGetLookupId(this.lookupName);
    this.systemLookup = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemLookups', { _id: lookupId }));

    if (this.systemLookup.dataTable.options) {
      this.showPdf = this.systemLookup.dataTable.options.reportTitle ? true : false
      this.showSummary = this.systemLookup.dataTable.options.summary ? this.systemLookup.dataTable.options.summary : false
    }

    Object.assign(this.dataTableOptions, this.systemLookup.dataTable.options);

    if (this.dataTable && 'columns' in this.dataTable) {
      this.systemLookup.dataTable = this.dataTable;
      Object.assign(this.dataTableOptions, this.dataTable.options);
    }
    if (this.systemLookup && !isEmptyObject(this.systemLookup)) {

      // let queryParams = await funcs.callbackToPromise(this.route.queryParams);
      // let url: any = funcs.parseUrlParams(queryParams);
      // this.objLocal.url = url;

      // set default config
      this.setDefaultConfig();

      if (!this.isModal) {
        this.columns = this.getColumns(this.systemLookup);
        if (this.routeSub) {
          this.routeSub.unsubscribe();
        }
        let message = '0. ' + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'request route query params';
        funcs.consoleLog(message);

        this.routeSub = this.route.queryParams.subscribe((params) => {
          let result = this.isUrlChanged(params);

          if (result || this.firstInit) {
            this.methods = [];

            let url: any = funcs.parseUrlParams(params);
            this.objLocal.url = url;
            if ('sort' in url) {
              let arr = url.sort.split('.');
              this.setSort({active: arr[1], direction: arr[0]});
            } else {
              this.setDefaultSort();
            }

            this.setDefaultPageSize();

            if ('keywords' in url) {
              this.keywords = url.keywords;
            } else {
              this.keywords = '';
            }

            let filterIds = this.getFilters(params);

            this.filterConditions = this.generateConditionsFromUrl(params);

            let message = '2. ' + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'request main auto run.';
            funcs.consoleLog(message);

            // if (Session.get('enableCheckUpdate')) {
            this.loading = true;
            this.isLoading.emit(true);

            if (this.documentId === undefined) {
            } else {
              this.objLocal['documentId'] = this.documentId;
            }
            this.renderDatatable();
            // }
          }

        });
      } else {
        this.showTable = false;
        if (this.documentId === undefined) {
        } else {
          this.objLocal['documentId'] = this.documentId;
        }

        funcs.consoleLog('render 3');

        this.renderDatatable();
      }
      this.onDatabaseChange();
    }
  }

  setDefaultConfig() {
    this.setDefaultSort();
    this.setDefaultPageSize();
  }

  async addTotalRow() {
    let allResults = await this.allResults()
    let totals = await this.calculateTotals(allResults)
    return totals
  }

  isUrlChanged(params) {
    let params_copy = Object.assign({}, params);
    this.state.view = params.view;

    delete params_copy.view;
    if (Object.keys(params_copy).length == 0) {
    }

    let compareResult = funcs._isObjectChangedAll(params_copy, this.state.queryParams);

    if (compareResult) {
      this.state.queryParams = params_copy;
    }
    return compareResult;
  }

  onMobileClick(row) {
    if (this.Device.isPhone()) {

      this._onMobileClick.emit(row);
    }
  }

  ngOnInit() {
    // Session.set('enableCheckUpdate', true);

    this.systemLog = PageResolver.systemLog;
    // assign the path name to objLocal object
    Object.assign(this.objLocal, { pathname: window.location.pathname });

    this.asyncFunctions();
  }

  generateConditionsFromUrl(params) {
    let conditions = [];

    Object.keys(params).forEach(key => {
      if (key != 'filters' && key != 'sort') {
        if (key.split('.')[0] == 'url') {
          if (!('url' in this.objLocal)) {
            this.objLocal.url = {};
          }
          let arr = key.split('.');
          Object.assign(this.objLocal.url, { [key.split('.')[1]]: params[key] });
        } else {
          let index = params[key].indexOf('.');
          let arr = [];
          if (index > -1) {
            arr.push(params[key].slice(0, index));
            arr.push(params[key].slice(index + 1));

            this.columns.findIndex(column => {
              if (column.prop == key) {
                conditions.push({
                  field: key,
                  method: arr[0],
                  value: arr[1],
                });
                return true;
              }
            });
          } else {

            if (key == 'pagesize') {
              this.pageSize = Number(params[key]);
            } else if (key == 'pageindex') {
              this.pageIndex = Number(params[key]);
            }

            if (this.pageIndex > 0) {
              this.skip = this.pageSize * this.pageIndex;
            }
          }
        }
      }
    });
    if ('sort' in params) {
      let arr = params['sort'].split('.');
      if (this.method.type == 'aggregate') {
        this.aggregateSortOption = { "$sort": { [arr[1]]: Number(arr[0]) } };
      }
    }
    // else {
    //   this.aggregateSortOption = {};
    // }
    return conditions;
  }


  getFilters(params) {
    let filterIds;
    Object.keys(params).forEach((key) => {
      if (key === 'filters') {
        filterIds = params[key];
      } else if (key === 'keywords') {
        this.keywords = params[key];
      }
    });
    return filterIds;
  }

  onDatabaseChange() {
    this.systemLookup.subscriptions.forEach((subscription, index) => {
      let args = subscription.args;
      args = funcs.parseAll(args, this.objLocal);

      this.subscribeSubscriptions[index] = MeteorObservable.subscribe(subscription.name, ...args).subscribe(() => {
        let autoSubscribe = MeteorObservable.autorun().subscribe(() => {
          // Tracker.autorun(() => {
          let result = AllCollections[subscription.name].collection.find().fetch();
          if (!this.firstInit) {
            this.reloadData(Random.id());
          }
        });
        this.autorunSubscriptions.push(autoSubscribe);
      });
    })
  }

  async renderDatatable() {
    let message = '3. ' + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'request render datatable';
    funcs.consoleLog(message);
    this.reloadData(Random.id());
  }

  reloadTable() {

    this.needRefresh = true;
  }

  reloadData(uniqueId) {
    this.loading = true;
    this.state.isSaveButtonEnabled = false;
    let message = '4. ' + uniqueId + " " + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'reload data';
    funcs.consoleLog(message);

    this.tempSystemLookup = this.systemLookup;

    this.columns = this.getColumns(this.systemLookup);

    this.displayedColumns = [];
    if (!this.isWidget) {
      this.columns.forEach(column => {
        if (column.hidden == false) {
          this.displayedColumns.push(column.prop);
          this.showTable = true;
        }
      });
    } else if (this.isWidget) {
      this.columns.forEach(column => {
        if (column.widget == true) {
          this.displayedColumns.push(column.prop);
          this.showTable = true;
        }
      });
    }

    this.exampleDatabase = new BehaviorSubject<any[]>([]);

    this.setRows(this.systemLookup, uniqueId);
  }

  addRow(row: any) {
    const dataTable = this.systemLookup.dataTable;

    this.displayedColumns.forEach(column => {

      let temp;
      if (column.indexOf('.') !== -1) {
        let arrParam = column.split('.');
        temp = Object.assign({}, row);

        arrParam.forEach(value => {
          temp = temp[value];
        });
        row[column] = temp;
      }
    });

    if ('options' in dataTable) {
      if ('controlFieldName' in dataTable.options) {
        if (row[dataTable.options.controlFieldName]) {
          if ('highlightFieldName' in dataTable.options) {
            row['highlightFieldName'] = dataTable.options.highlightFieldName;
          }
          if ('compareFields' in dataTable.options) {
            dataTable.options.compareFields.forEach(fieldName => {
              if (Number(row[fieldName].toFixed(2)) == row[dataTable.options.highlightFieldName]) {
                row['highlightFieldName'] = fieldName;
              }
            })
          }
        }
      }
    }

    const copiedData = this.exampleDatabase.value.slice();
    copiedData.push(this.createNewRow(row));
    this.exampleDatabase.next(copiedData);
  }

  private createNewRow(row: any) {
    let newRow: any = {};
    this.displayedColumns.forEach((column) => {
      newRow[column] = row[column];
      if ('_id' in row) {
        newRow['_id'] = row['_id'];
      }
    });
    if ('highlightFieldName' in row) {
      newRow.highlightFieldName = row.highlightFieldName;
    }

    const dataTable = this.systemLookup.dataTable;
    if ('options' in dataTable) {
      if ('checkGrossProfit' in dataTable.options) {
        if (row[dataTable.options.checkGrossProfit] >= 27) {
          newRow.backgroundColor = 'green';
        } else if (row[dataTable.options.checkGrossProfit] >= 18) {
          newRow.backgroundColor = 'yellow';
        } else {
          newRow.backgroundColor = 'red';
        }
      }
    }

    return newRow;
  }

  setRows(systemLookup, uniqueId) {
    let methods = systemLookup.methods;
    this.methods = methods;
    this.retrieveData(methods, uniqueId);
  }

  retrieveData(methods: any = [], uniqueId) {
    methods.forEach(async (method) => {
      if (method) {
        if (method.isHeader === true) {
          await this.runAggregateOrFindMethod(method, uniqueId);
        } else {
          // find the first method to run
        }
      }
    })
  }

  getColumns(systemLookup: any) {
    let arr = [];
    // select displayed columns to data table

    let columns = systemLookup.dataTable.columns.slice();
    // let temp = funcs.parseParams(columns[0], this.objLocal);
    columns.forEach((column) => {
      let obj = {};
      column = funcs.parseParams(column, this.objLocal);

      if (!column.hidden) {
        Object.keys(column).forEach(key => {
          obj[key] = column[key];
        });
        arr.push(obj);
      }
    });
    return arr;
  }

  getRowsFromMethod(res, method, uniqueId) {
    if ('return' in method) {
      if ('returnable' in method.return) {
        this.returnType = method.return.type;
        if (method.return.returnable === true) {
          this.returnable = true;
          if ('canRunMethod' in method.return) {
            this.canRunMethod = method.canRunMethod;
          }
          if ('data' in method.return) {
            this.returnData = method.return.data;
          }
        }
      }

      if (this.checkNextMethodExists(method)) {
        if (method.return.dataType == "object") {
          // let result = AllCollections[method.collectionName].collection.find(this.methodArgs[0], this.methodArgs[1]).fetch();
          this.objLocal[method.return.as] = res[0];
          this.runAggregateOrFindMethod(this.methods[method.return.nextMethodIndex], uniqueId);
        } else {
        }
        return;
      }
    }

    this.rows = [];
    this.selected = [];
    this.selectedIds = [];

    res.forEach((doc, index) => {
      if (doc.enabled === true) {
        this.selected.push(doc);
        this.selectedIds.push(doc._id);
      }
      this.rows[this.skip + index] = doc;
      this.addRow(doc);
    });

    if (this.rows.length > 0) {
      if (this.lookupName == 'manageCategoryProducts') {
        if (this.state.isDirty == false) {
          this.state.initRows = this.rows.slice();
          this.state.isDirty = true;
        }
      }
    }

    // this.temp = this.rows.slice();
    if (method.type === 'find') {
      if (this.systemLookup) {
        let subscriptionName = method.subscriptionName;
        if ('subscriptionName' in this.systemLookup) {
          subscriptionName = this.systemLookup.subscriptionName;
        }

        this.count = Counts.get(subscriptionName);
      }
    } else {
      // this.count = this.rows.length;
    }
    this.dataSource = new ExampleDataSource(this.exampleDatabase);
    if ('totalLogic' in this.systemLookup && this.lastPageCheck()) {
      this.dataSource._database._value.push(this.totalObj);
    }
    this.loading = false;

    this.oldSelected = this.selected.slice();
    funcs.consoleLog('5. ' + uniqueId + " " + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' loading complete');
    this.tableRows.emit(this.rows);
    this.isLoading.emit(false);
    if ('selectOnOneResult' in this.systemLookup.dataTable.options) {
      if (this.systemLookup.dataTable.options.selectOnOneResult) {
        if (this.rows.length == 1) {
          this.onSelected.emit(this.rows[0]);
        }
      }
    }

    if (this.systemLookup.category == 'contractPricing') {
      if (this.rows.length > 0) {
        let onContractProducts = this.rows.filter((row) => row.isOnContract == true);
        if (onContractProducts.length == 0 && this.firstInit) {
          MeteorObservable.call('getAllowedCategoryProducts', this.objLocal.url.categoryId).subscribe(async (res: any) => {
            this.methodsToBeRun = [];
            const set = new Set();

            await Promise.all(res.map(async (row) => {
              set.add(row._id);
              // await this.updateContractProducts(row, {prop: 'isOnContract'}, true);
            }));
            this.checkSaveButton();
            this.exampleDatabase.value.forEach(row => {
              if (set.has(row._id)) {
                row.isOnContract = true;
                row.backgroundColor = 'green';
              }
            });
          })
        }
      }
    }
    this.firstInit = false;
    this.needRefresh = false;
    // console.log(this.sortActive);
    // final
  }

  async runAggregateOrFindMethod(method: any, uniqueId) {

    let methodArgs = [];

    if (method && 'type' in method && (method.type === 'aggregate' || method.type === 'find')) {
      this.method = method;
      if (method.type === 'aggregate') {

        // add modalFilters to filter conditions if exists
        this.addModalFilters();

        this.dataTableOptions.externalSorting = false;

        if (this.isModal) {
          this.aggregateDep.depend();
        }
        if (method.collectionName == 'products') {
        }
        debugger;

        methodArgs = funcs.parseAll(method.args, this.objLocal);
        debugger;

        methodArgs = this.getFilterConditionsIfExist(method, methodArgs);
        debugger;

        if ('return' in method) {
          if (!this.checkNextMethodExists(method)) {
            if (this.keywords) {
              let result = generateRegexWithKeywords(this.displayedColumns, this.keywords);
              methodArgs[0].push({ $match: result });
            }
          }
        } else if (this.keywords) {
          let result = generateRegexWithKeywords(this.displayedColumns, this.keywords);
          methodArgs[0].push({ $match: result });
        }

        debugger;


        if ('datePaths' in method.args[0]) {
          method.args[0].datePaths.forEach(datePath => {
            funcs.setObjectValue(methodArgs[0], datePath, new Date(funcs.getObjectValue(methodArgs[0], datePath)));
          })
        }

        methodArgs = this.getQueryOptions(method, methodArgs);

        this.methodArgs = methodArgs;
        // if (method.collectionName == 'products') {
        // // JSONTET
        // console.log(this.systemLookup.name, method.collectionName, JSON.stringify(methodArgs));
        // //   console.log(methodArgs);
        // }
        let res: any = await funcs.callbackToPromise(MeteorObservable.call('aggregate', method.collectionName, ...methodArgs));
        if (res) {
          let result = res.result;
          if (res.count.length > 0) {
            this.count = res.count[0].count;
          } else {
            this.count = 0;
          }
          if (this.lastPageCheck()) {
            this.totalObj = await this.addTotalRow();
          }
          this.exampleDatabase = new BehaviorSubject<any[]>([]);

          if (this.data) {
            if ('hidden' in this.data) {
              this.hideDelete = !this.data.hidden;
            }
          }
          this.getRowsFromMethod(result, method, uniqueId);
        }
      }
      this.aggregate.emit([method.type, methodArgs])
    }
  }

  lastPageCheck() {
    return ((Math.ceil(this.count / this.pageSize) - 1) === this.pageIndex) ? true : false;
  }

  ngOnChanges(changes) {
    this.reloadTable();
    this.exampleDatabase = new BehaviorSubject<any[]>([]);
    this.dataSource = new ExampleDataSource(this.exampleDatabase);

    this.pageIndex = 0;
    this.pageSize = 10;
    this.skip = 0;
    Object.keys(changes).forEach(key => {
      if (key == 'data') {
        this.data = changes.data.currentValue;
        this.objLocal['data'] = this.data;
      }
    });
    // console.log(this.systemLookup);
    // console.log(!funcs.isEmptyObject(this.systemLookup));
    if (!funcs.isEmptyObject(this.systemLookup)) {

      this.setDefaultConfig();
      this.reloadData('data change');
    }
  }

  setDefaultSort() {
    if ('sort' in this.systemLookup.dataTable.options) {
      let sort = Object.assign({}, this.systemLookup.dataTable.options.sort);
      if ('conditions' in this.systemLookup.dataTable.options.sort) {
        let conditions = this.systemLookup.dataTable.options.sort.conditions;
        conditions.forEach(condition => {
          let key = condition.case;
          let value = condition.value;

          if (funcs.getObjectValue(this.objLocal, key) == value) {
            sort.active = condition.active;
            sort.direction = condition.direction;
          }
        })
      }
      this.setSort(sort);
    }
  }

  setSort(sort) {
    sort.direction = Number(sort.direction);

    if (Number(sort.direction) == 1) {
      this.sortDirection = 'asc';
    } else if (sort.direction == -1) {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = '';
    }
    this.sortActive = sort.active;
    this.aggregateSortOption = {
      "$sort": {
        [sort.active]: sort.direction
      }
    }
  }

  setDefaultPageSize() {
    if (!isEmptyObject(this.systemLookup)) {
      if ('options' in this.systemLookup.dataTable) {
        if ('pageSize' in this.systemLookup.dataTable.options) {
          this.pageSize = this.systemLookup.dataTable.options.pageSize;
        }
        if ('widgetPageSize' in this.systemLookup.dataTable.options && this.isWidget) {
          this.pageSize = this.systemLookup.dataTable.options.widgetPageSize;
        }
      }
    }
  }

  generateFilterConditions(type) {
    let and, result;

    if (type === 'find') {
      result = { $and: [] };
      and = result.$and;
    } else {
      result = { $match: { $and: [] } };
      and = result.$match.$and;
    }

    this.filterConditions.forEach(condition => {
      if (!('value' in condition)) {
        condition['value'] = '';
      }
      funcs.generatePipeline(condition, and);
    });

    return result;
  }

  onStatusChange(event, selectedRow) {
    selectedRow.status = event.value;

    this.objLocal['selectedRow'] = selectedRow;
    this.methods.forEach(method => {
      let methodArgs = [];

      if (method.type === 'update') {
        methodArgs = funcs.parseAll(method.args, this.objLocal);
        MeteorObservable.call('update', method.collectionName, ...methodArgs)
          .subscribe();
      }
    })
  }

  async runActions() {
    this.user = Meteor.user();
    // let allConnections:any = await funcs.getPageConnections(window.location.pathname);
    // const userConnection = allConnections.find(connection => {
    //   if (connection._id == Meteor.userId()) {
    //     return connection;
    //   }
    // });
    // if (this.config.enableMultipleUsersUpdate || (userConnection && userConnection.editable)) {
    if (this.config.enableMultipleUsersUpdate) {
      let updateSuccess = 0;
      let updateFailed = 0;

      let removeMethodRowIds = new Set();
      let updateInsertMethodRowIds = new Set();
      let normalMethodRowIds = new Set();
      let updateInsertMethods = [];
      let updateRemoveMethods = [];
      let normalMethods = [];
      this.methodsToBeRun.forEach(method => {
        if (method.type == 'update.remove') {
          updateRemoveMethods.push(method);
          removeMethodRowIds.add(method.rowId);
        } else if (method.type == 'update.insert') {
          updateInsertMethods.push(method);
          updateInsertMethodRowIds.add(method.rowId);
        } else {
          normalMethods.push(method);
          normalMethodRowIds.add(method.rowId);
        }
      });

      this.methodsToBeRun = [...updateInsertMethods, ...updateRemoveMethods, ...normalMethods];
      //
      if (removeMethodRowIds.size > 0) {
        this.methodsToBeRun = this.methodsToBeRun.filter((method, index) => {
          if (!removeMethodRowIds.has(method.rowId)) {
            return true;
          } else if (method.type == 'update.remove') {
            return true;
          }
        })
      }

      // this.methodsToBeRun = this.methodsToBeRun.

      // if (methodIndex >= 0){
      //   this.methodsToBeRun = this.methodsToBeRun.filter((method, index) => {
      //     if (methodIndex == index || true) {
      //
      //     }
      //   })
      // }

      if (this.methodsToBeRun.length > 0) {
        if ('saveLog' in this.systemLookup.dataTable.options) {
          let saveLog = this.systemLookup.dataTable.options.saveLog;
          let log: any = funcs.testParseParams(saveLog, this.objLocal);

          Object.assign(log.value, { _id: Random.id(), date: new Date() });
          funcs.log(this.systemLog._id, log.value);
        }
      }


      let failedArray = [];

      await Promise.all(this.methodsToBeRun.map(async (method: any) => {

        let result = await funcs.callbackToPromise(MeteorObservable.call(method.type, method.collectionName, method.query, method.update));

        if ('log' in method) {
          funcs.log(this.systemLog._id, method.log);
        }

        if (result) {
          updateSuccess++;
        } else {
          let obj: any = {
            query: method.query
          };
          if ('update' in method) {
            obj.update = method.update;
          }
          if ('collectionName' in method) {
            obj.collectionName = method.collectionName;
          }
          if ('document' in method) {
            obj.document = method.document;
          }
          failedArray.push(obj);
          updateFailed++;
        }

      }));

      this.methodsToBeRun = [];

      if (updateSuccess > 0) {
        this._service.success(
          "Success",
          updateSuccess + " updated successfully"
        );
        this.reloadData(updateSuccess + ' updated successfully');
      }
      if (updateFailed > 0) {
        failedArray.forEach(fail => {
          let log = {
            log: JSON.stringify(fail.query) + " " +
              "______" +
              JSON.stringify(fail.update),
            date: new Date(),
            document: fail.document,
            collectionName: fail.collectionName + " Failed Update",
            _id: Random.id()
          };

          funcs.log(PageResolver.systemLog._id, log);
        })

        this._service.error(
          "Error",
          updateFailed + " update failed"
        );
      }
    } else {
      this._service.error('Error', "Can't edit");
    }
  }

  onChange(event, row, column, index) {
    this.objLocal['selectedRow'] = row;
    row.backgroundColor = 'green';

    if (this.config.isReactiveUpdate) {
      // this.reactiveUpdate(event, row, column, index);
    } else {
      this.nonReactiveUpdate(event, row, column, index);
    }
  }

  getCheckboxFieldName() {
    let checkboxFieldName = '';
    if ('checkboxFieldName' in this.systemLookup.dataTable.options) {
      checkboxFieldName = this.systemLookup.dataTable.options.checkboxFieldName;
    }
    return checkboxFieldName;
  }

  async overrideChange(event, row, column, index) {
    row['newHighlightField'] = column.prop;
    if (this.systemLookup.category == 'contractPricing') {
      let checkboxFieldName = this.getCheckboxFieldName();

      let checked = row[checkboxFieldName];
      if (checked) {
        let query = {
          _id: row._id + '.' + this.systemLookup.dataTable.options.updatedFieldName
        };
        // this.removeMethodToBeRun(query);
        this.onChange(event, row, column, index);
      } else {
        this.updateContractProducts(row, column, true);
      }
    } else {
      this.onChange(event, row, column, index);
    }
    this.checkSaveButton();
  }

  reactiveUpdate(event, row, fieldName) {
    this.methods.forEach(method => {
      let methodArgs = [];

      if (method.type === 'update' && method.name == fieldName) {
        this.objLocal['selectedRow'].value = row[fieldName];
        this.objLocal['selectedRow'].fieldName = fieldName;

        // let logOption = this.findLogOption(method, fieldName);

        let index = this.state.initRows.findIndex((doc) => {
          if (doc._id == row._id) {
            return true;
          }
        });
        let newPrice = this.objLocal['selectedRow'].newValue;

        if (this.lookupName == 'manageCategoryProducts') {
          if (newPrice == this.state.initRows[index].price) {
            this.objLocal['selectedRow'].value = this.state.initRows[index].previousPrice;
          }
        }

        methodArgs = funcs.parseAll(method.args, this.objLocal);
        MeteorObservable.call('update', method.collectionName, ...methodArgs).subscribe(() => {
          let logMessage = 'Update ' + fieldName + ' to ' + this.objLocal['selectedRow'].newValue + ' from ' + this.objLocal['selectedRow'].value;

          let log = {
            _id: Random.id(),
            documentId: row._id,
            collectionName: method.collectionName,
            document: row[method.document],
            type: 'update',
            field: fieldName,
            message: logMessage,
            date: new Date(),
            value: this.objLocal['selectedRow'].newValue,
            previousValue: this.objLocal['selectedRow'].value,
            pathname: window.location.pathname
          };

          funcs.log(this.systemLog._id, log);

        });
      } else {

      }
    });
  }

  // async onQueryParamsChange(params) {
  //   this.methods = [];
  //   // this.unSubscribe(this.autorunSubscriptions);
  //   // this.unSubscribe(this.observeSubscriptions);
  //
  //   let url: any = funcs.parseUrlParams(params);
  //   this.objLocal.url = url;
  //
  //   if ('keywords' in url) {
  //     this.keywords = url.keywords;
  //   } else {
  //     this.keywords = '';
  //   }
  //
  //   let filterIds = this.getFilters(params);
  //
  //   this.filterConditions = this.generateConditionsFromUrl(params);
  //
  //   let message = '2. ' + this.systemLookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'request main auto run.';
  //   funcs.consoleLog(message);
  //
  //   // let handle = Tracker.autorun(() => {
  //
  //   // if (Session.get('enableCheckUpdate')) {
  //   //   this.loading = true;
  //   //   this.isLoading.emit(true);
  //   //
  //   //   if (this.documentId === undefined) {
  //   //   } else {
  //   //     this.objLocal['documentId'] = this.documentId;
  //   //   }
  //   //
  //   //   this.dep1.depend();
  //   //   this.renderDatatable();
  //   // }
  //   // });
  //   // this.trackerAutoruns.push(handle);
  // }

  nonReactiveUpdate(event, row, column, index) {

    let path = "dataTable.options.controlFieldName";

    if (!funcs.checkNullFromObject(this.systemLookup, path)) {
      if (!row[funcs.getObjectValue(this.systemLookup, path)]) {
        return;
      }
    }

    let initRow = this.rows[index];
    this.exampleDatabase.value[index]['newHighlightField'] = column.prop;
    // this.exampleDatabase.value[index].isChanged = true;

    this.methods.forEach(originMethod => {
      let methodArgs = [];

      let method: any = {};
      Object.assign(method, originMethod);

      if (originMethod.name === column.methodName) {

        if (row[column.updatedFieldName]) {
          this.objLocal['selectedRow']['value'] = initRow[column.updatedFieldName];
        } else {
          if (column.type == 'number') {
            this.objLocal['selectedRow']['value'] = Number(initRow[column.updatedFieldName]);
          } else
            this.objLocal['selectedRow']['value'] = initRow[column.updatedFieldName];
        }

        if ('value' in event.target) {
          row[column.prop] = event.target.value;
        }
        if (column.type == 'number') {
          row[column.prop] = Number(Number(row[column.prop]).toFixed(2));
        }
        this.objLocal['selectedRow']['newValue'] = row[column.prop];

        methodArgs = funcs.parseAll(originMethod.args, this.objLocal);


        method = {
          _id: row._id + '.' + this.systemLookup.dataTable.options.updatedFieldName,
          rowId: row._id,
          type: originMethod.type,
          name: originMethod.name,
          collectionName: originMethod.collectionName,
          query: methodArgs[0],
          update: methodArgs[1],
        };

        if ('log' in originMethod) {
          let log = funcs.testParseParams(originMethod.log, this.objLocal);

          let obj = {
            _id: Random.id(),
            date: new Date(),
            pathname: window.location.pathname
          };
          Object.assign(log.value, obj);
          method.log = log.value;
        }

        let newMethodArr = [];

        this.methodsToBeRun.forEach((methodToBeRun) => {
          if (methodToBeRun._id != method._id) {
            newMethodArr.push(methodToBeRun);
          }
        });

        if (!funcs.checkNullFromObject(this.systemLookup, path)) {
          if (row[funcs.getObjectValue(this.systemLookup, path)]) {
            newMethodArr.push(method);
          }
        }
        this.methodsToBeRun = newMethodArr;
      }
    });
    this.checkSaveButton();
  }

  async onContractProductPriceChange(event, row, column, index) {
    let checkboxFieldName = this.getCheckboxFieldName();

    if (!row[column.prop]) {
      if (event.target.type == 'number') {
        row[column.prop] = event.target.valueAsNumber;
      }
    }
    this.objLocal['selectedRow'] = row;
    if (row[checkboxFieldName]) {
      if (row['newHighlightField'] == column.prop && column.prop != 'contractPrice') {
        // deselect
        this.unSetPrice(event, row, column, index);
      } else {
        // select
        this.setPrice(event, row, column, index);
      }
    }
    this.checkSaveButton();
  }

  async setPrice(event, row, column, index) {
    row['newHighlightField'] = column.prop;
    let checkboxFieldName = this.getCheckboxFieldName();
    row.backgroundColor = 'green';
    if (this.rows[index][checkboxFieldName]) {
      this.nonReactiveUpdate(event, row, column, index);
    } else {
      this.updateContractProducts(row, column, true);
    }
  }

  unSetPrice(event, row, column, index) {
    row['newHighlightField'] = '';
    row.backgroundColor = '';
    let query = {
      _id: row._id + '.' + this.systemLookup.dataTable.options.updatedFieldName
    };
    this.removeMethodToBeRun(query);
  }

  hightlightChangedRows() {
    const set = new Set();
    this.methodsToBeRun.forEach(row => {
      set.add(row.rowId);
    });
    this.rows.forEach((row, index) => {
      if (set.has(row._id)) {
        this.exampleDatabase.value[index].isChanged = true;
      } else {
        this.exampleDatabase.value[index].isChanged = false;
      }
    })
  }

  selectColumn(column) {
    for (var i = 0; i < this.dataSource._database._value.length; i++) {
      if (this.selectedLevelHeader !== column) {
        this.dataSource._database._value[i].selectedLevelPrice = Math.round(this.dataSource._database._value[i][column] * 100) / 100
        this.dataSource._database._value[i]['highlightFieldName'] = column
      } else {
        this.dataSource._database._value[i].selectedLevelPrice = undefined;
        this.dataSource._database._value[i]['highlightFieldName'] = undefined
      }
    }
    this.selectedLevelHeader = (this.selectedLevelHeader !== column) ? column : undefined;
    this.onSelected.emit(this.dataSource._database._value);
  }

  quoteOnChange(event, row, column, index, fieldName) {
    this.exampleDatabase.value[index]['highlightFieldName'] = column.prop;

    if (fieldName == 'override') {
      // event.target.blur();
    }
    this.objLocal['selectedRow'] = row;
    if (event.target.type == 'number') {
      this.objLocal['selectedRow'].newValue = Number(event.target.value);
      if (row.selectedLevelPrice !== Number(event.target.value)) {
        if (Number(event.target.value) > 0) {
          row.selectedLevelPrice = Number(event.target.value);
          row.highlightFieldName = column.prop;
        }
        if (column.prop === 'override') {
          // row.override = row.selectedLevelPrice
          if (Number(event.target.value) > 0) {
            row.override = row.selectedLevelPrice
          } else {
            row.selectedLevelPrice = null;
            row.highlightFieldName = null;
          }
        }
      } else {
        row.selectedLevelPrice = null;
        row.highlightFieldName = null;
      }
    } else {
      this.objLocal['selectedRow'].newValue = event.target.value;
    }
    this.onSelected.emit([row]);
  }

  quoteReviewLevelChange(event, row, fieldName) {
    this.objLocal['selectedRow'] = row;
    if (event.target.type == 'number') {
      this.objLocal['selectedRow'].newValue = Number(event.target.value);
      if (row.selectedLevelPrice !== Number(event.target.value)) {
        row.selectedLevelPrice = Number(event.target.value);
        if (fieldName === 'override') {
          // row.override = row.selectedLevelPrice
          if (Number(event.target.value) > 0) {
            row.override = row.selectedLevelPrice
          }
        }
        this.runMethods(this.methods, { name: "quotePrice", type: 'update' })
        row.quotePrice = row.selectedLevelPrice
      } else {
        // row.selectedLevelPrice = null;
      }
    } else {
      this.objLocal['selectedRow'].newValue = event.target.value;
    }
    this.updateGrossProfit(row)
    // this.onSelected.emit([row]);
  }

  changeGrossProfit(event, row) {
    this.objLocal['selectedRow'] = row;
    row.grossProfit = event.target.value;
    row.quotePrice = (row.stdCost / (100 - event.target.value) * 100);
    this.objLocal['selectedRow'].newValue = Number(row.quotePrice.toFixed(2));
    this.runMethods(this.methods, { name: "quotePrice", type: 'update' });
    row.selectedLevelPrice = Number(row.quotePrice.toFixed(2));
    row.override = row.selectedLevelPrice
  }

  updateGrossProfit(row) {
    row.grossProfit = (((row.quotePrice - row.stdCost) / row.quotePrice) * 100)
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

    MeteorObservable.call('update', 'systemLogs', query, update).subscribe();
  }

  findLogOption(method, fieldName) {
    let index = LogService.logOptions.value.findIndex((option: any) => {
      if (option.logFields.includes(fieldName) && option.actionTypes.includes('update') && method.collectionName === option.collectionName) {
        return true;
      }
    });

    return LogService.logOptions.value[index];

  }

  onClick(selectedRow, selectedColumn, selectedMethod) {
    this.objLocal['selectedRow'] = selectedRow;
    this.isClick = true;
    if (selectedMethod !== null) {
      if (selectedMethod.name === 'remove' || selectedMethod.name === 'disable' || selectedMethod.type === 'remove') {
        this.openDialog(selectedMethod);
      } else {
        this.runMethods(this.methods, selectedMethod);
      }
      // if (selectedMethod.type === 'update') {
      //
      //   if (selectedMethod.name === 'disable') {
      //     this.openDialog(selectedMethod);
      //   } else {
      //     //this.runMethods(this.functions, selectedMethod);
      //     this.openDialog(selectedMethod);
      //
      //   }
      // } else if (selectedMethod.type === 'remove') {
      //   this.openDialog(selectedMethod);
      //
      // }
    } else {
      let dialogRef = this.dialog.open(DialogComponent, {
        height: "600px",
        width: "800px"
      });

      selectedRow = {
        _id: selectedRow._id
      };

      let lookupName = 'manageUserTenantGroups';
      if (selectedColumn !== null) {
        lookupName = selectedColumn.lookupName;
      }

      dialogRef.componentInstance['lookupName'] = lookupName;
      dialogRef.componentInstance['documentId'] = this.documentId;
      dialogRef.componentInstance['data'] = selectedRow;
      dialogRef.afterClosed().subscribe(result => {
        this.isClick = false;

        if (typeof result != 'undefined') {
        }
      });
    }
  }

  openDialog(selectedMethod) {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if ('default' in this.objLocal.selectedRow && this.objLocal.selectedRow.default === true) {
          this._service.alert(
            'Failed',
            'You can not delete system default document',
            {}
          )
        } else {
          this.runMethods(this.methods, selectedMethod);
        }
      }
    });
  }
  runMethod(method) {
    MeteorObservable.call('update', method.collectionName, method.query, method.update).subscribe(res => {

    });
  }

  runMethods(methods: any, selectedMethod) {
    methods.forEach(method => {
      if (selectedMethod.type === 'update') {

        if (selectedMethod.name === method.name) {
          let args = method.args.map((arg) => {
            arg = funcs.parseDollar(arg);
            arg = funcs.parseDot(arg);
            arg = funcs.parseParams(arg, this.objLocal);

            return arg.value;
          });

          MeteorObservable.call('update', method.collectionName, ...args).subscribe(() => {
            this._service.success(
              "Message",
              'Update Successfully',
              {
                timeOut: 3500,
                showProgressBar: true,
                preventDuplicates: true,
                pauseOnHover: false,
                clickToClose: true,
                maxLength: 40
              }
            );
            this.oldSelected = this.selected.slice();
          });
        }
      } else if (method.type === 'remove') {
        let args = method.args.map((arg) => {
          arg = funcs.parseDollar(arg);
          arg = funcs.parseDot(arg);
          arg = funcs.parseParams(arg, this.objLocal);

          return arg.value;
        });

        MeteorObservable.call('remove', method.collectionName, ...args).subscribe(() => {
          this._service.success(
            "Message",
            'Remove Successfully',
            {
              timeOut: 3500,
              showProgressBar: true,
              preventDuplicates: true,
              pauseOnHover: false,
              clickToClose: false,
              maxLength: 40
            }
          );
          this.oldSelected = this.selected.slice();
        });

      } else if (method.name = 'updateContractProducts') {
        // this.updateContractProducts(this.objLocal.selectedRow._id);
      }

    });
  }

  search(keywords) {
    // Session.set('enableCheckUpdate', true);
    this.keywords = keywords;
    this.skip = 0;
    this.pageIndex = 0;

    if (this.selectedColumn.prop) {
      this.modalFilters.push({
        prop: this.selectedColumn.prop,
        value: this.keywords,
        label: this.selectedColumn.name + ": " + this.keywords
      });
      this.keywords = '';
      this.selectedColumn = {};
      this.reloadData('searchreload');
    } else {
      if (this.isModal) {
        this.reloadData("search reload");
      } else {
        this.router.navigate([], { queryParams: { keywords, pageindex: this.pageIndex }, queryParamsHandling: 'merge' });
      }
    }



    // if (this.selectedColumn.prop) {
    //   this.modalFilters.push({
    //     prop: this.selectedColumn.prop,
    //     value: this.keywords,
    //     label: this.selectedColumn.name + ": " + this.keywords
    //   });
    //   if (this.isModal) {
    //
    //   }
    // } else {
    //   if (this.isModal) {
    //
    //   }
    // }
    // // if (this.method.type === 'aggregate') {
    // //   this.aggregateSearchOption = 1;
    // // }
    //
    // if (this.isModal){
    //   if (this.selectedColumn.name) {
    //     const obj = {
    //       field: this.selectedColumn.prop,
    //       method: "$regex",
    //       value: this.keywords
    //     };
    //     this.filterConditions.push(obj);
    //     // this.methodArgs[0][this.selectedColumn.prop] = this.selectedColumn.prop;
    //   }
    //
    //   if (!funcs.isEmptyObject(this.selectedColumn)) {
    //     this.keywords = '';
    //     this.selectedColumn = {};
    //   }
    //
    //   this.reloadData('searchreload');
    // } else {
    //   this.router.navigate([], {queryParams: {keywords, pageindex: this.pageIndex}, queryParamsHandling: 'merge'});
    // }
  }

  getFilterConditionsIfExist(method, methodArgs:any) {
    if (method.type === 'aggregate') {
      if (this.filterConditions && this.filterConditions.length > 0) {
        // if (method.isHeader == false || !('isHeader' in method)) {
        let filterConditions = this.generateFilterConditions('aggregate');
        methodArgs[0].push(filterConditions);
      }
    }
    return methodArgs;
  }

  getQueryOptions(method, methodArgs) {
    if ('return' in method) {
      if (this.checkNextMethodExists(method)) {

      } else {
        if (!funcs.isEmptyObject(this.aggregateSortOption)) {
          methodArgs[0].push(this.aggregateSortOption);
        }
        if (this.skip > 0) {
          methodArgs[0].push({
            "$skip": this.skip
          })
        }

        if (this.pageSize > 0) {
          methodArgs[0].push({
            "$limit": this.pageSize
          })
        }
      }
    } else {
      if (!funcs.isEmptyObject(this.aggregateSortOption)) {
        methodArgs[0].push(this.aggregateSortOption);
      }

      if (this.skip > 0) {
        methodArgs[0].push({
          "$skip": this.skip
        });
      }
      if (this.pageSize > 0) {
        methodArgs[0].push({
          "$limit": this.pageSize
        });
      }
    }
    return methodArgs;
  }

  onPage(event) {

    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.skip = event.pageSize * event.pageIndex;

    if (this.isModal) {
      if (this.method.type === 'aggregate') {
        this.reloadData('page change');
      }
    } else {
      this.router.navigate([], { queryParams: { pagesize: this.pageSize, pageindex: this.pageIndex }, queryParamsHandling: 'merge' });
    }
  }

  async onSort(event) {
    this.pageIndex = 0;
    if (this.isModal) {
      this.skip = 0;

      let direction = 0;
      if (event.direction == 'asc') {
        direction = 1;
      } else if (event.direction == 'desc') {
        direction = -1;
      } else {
        direction = 0;
      }

      if (direction == 0) {
        this.aggregateSortOption = {};
      } else {
        this.aggregateSortOption = {
          "$sort": {
            [event.active]: direction
          }
        };
      }

      this.reloadData('on sort');
    } else {
      let direction = 1;
      if (event.direction == 'asc') {
        direction = 1
      } else if (event.direction == 'desc') {
        direction = -1;
      } else {
        direction = 0;
      }

      if (direction == 0) {
        let result = await funcs.callbackToPromise(this.route.queryParams);
        let queryParams: any = Object.assign({}, result);
        delete queryParams.sort;
        delete queryParams.pageindex;
        delete queryParams.pagesize;
        this.router.navigate([], { queryParams: queryParams });
      } else {
        this.router.navigate([], { queryParams: { sort: direction + '.' + event.active, pageindex: this.pageIndex }, queryParamsHandling: 'merge' });
      }
      //
    }
  }

  checkNextMethodExists(method) {
    if ('next' in method.return && method.return.next === true)
      return true;
    else
      return false;
  }

  async onCheckboxChange_contractPricing(event, row, column) {
    row[column.prop] = event.checked;
    this.objLocal['selectedRow'] = row;

    if (this.returnable) {
      let result = '';
      let selected = event.selected[0];

      if (this.returnData) {
        this.returnData.forEach(field => {
          if (field in selected) {
            result += selected[field];
          } else {
            result += field;
          }
        })
      } else {
        result = selected;
      }
      this.onSelected.emit(result);
      return;
    }

    let checkboxFieldName = this.systemLookup.dataTable.options.checkboxFieldName;

    if (event.checked) {
      await this.checkRow(row, checkboxFieldName);
    } else {
      await this.unCheckRow(row, checkboxFieldName);
    }
    this.checkSaveButton();
  }

  async onCheckboxChange(event, row, column) {
    this.objLocal['selectedRow'] = row;
    if (column.cellTemplate == 'addTmpl') {
      if (event.checked) {
        column.methodName = column.addMethodName;
      } else {
        column.methodName = column.removeMethodName;
      }
    } else if (column.cellTemplate == 'enableTmpl') {

      if (event.checked) {
        column.methodName = column.enableMethodName;
      } else {

        column.methodName = column.disableMethodName;
      }
    }

    let methods = this.systemLookup.methods;
    let methodIndex = this.systemLookup.methods.findIndex(method => {
      if (method.name == column.methodName) {
        return true;
      }
    });
    let originMethod = Object.assign({}, methods[methodIndex]);

    originMethod.args = funcs.parseAll(originMethod.args, this.objLocal);

    this.objLocal['selectedRow'].newValue = event.checked;

    this.objLocal['selectedRow']['value'] = row[originMethod.fieldName];

    let method: any = {
      _id: row._id + '.' + column.prop,
      rowId: row._id,
      name: originMethod.name,
      type: originMethod.type,
      collectionName: originMethod.collectionName,
      query: originMethod.args[0],
      update: originMethod.args[1]
    };

    if ('log' in originMethod) {
      let log = funcs.testParseParams(originMethod.log, this.objLocal);

      let obj = {
        _id: Random.id(),
        date: new Date(),
        pathname: window.location.pathname
      };
      Object.assign(log.value, obj);
      method.log = log.value;
    }

    if (this.config.isReactiveUpdate) {
      // this.reactiveUpdate(event, row, fieldName);
      MeteorObservable.call('update', method.collectionName, method.query, method.update).subscribe(res => {
      });
    } else {
      let methodIndex = this.methodsToBeRun.findIndex(methodToBeRun => methodToBeRun._id == method._id);
      if (methodIndex >= 0) {
        this.methodsToBeRun[methodIndex] = method;
      }
      else {
        this.methodsToBeRun.push(method);
      }
    }
    this.checkSaveButton();
  }

  onCheckboxChangeAdd(event, row, column) {
    row[column.prop] = event.checked;
    this.objLocal['selectedRow'] = row;

    if (this.returnable) {
      let result = '';
      let selected = event.selected[0];

      if (this.returnData) {

        this.returnData.forEach(field => {
          if (field in selected) {
            result += selected[field];
          } else {
            result += field;
          }
        })
      } else {
        result = selected;
      }
      this.onSelected.emit(result);
      return;
    }


    let methods = this.systemLookup.methods;
    let methodIndex = this.systemLookup.methods.findIndex(method => {
      if (method.name == column.methodName) {
        return true;
      }
    });
    let originMethod = Object.assign({}, methods[methodIndex]);

    originMethod.args = funcs.parseAll(originMethod.args, this.objLocal);

    this.objLocal['selectedRow'].newValue = event.checked;

    this.objLocal['selectedRow']['value'] = row[originMethod.fieldName];

    let method = {
      _id: row._id + column.prop,
      rowId: row._id,
      name: originMethod.name,
      type: originMethod.type,
      collectionName: originMethod.collectionName,
      query: originMethod.args[0],
      update: originMethod.args[1]
    }

    if (this.config.isReactiveUpdate) {
      // this.reactiveUpdate(event, row, fieldName);
      MeteorObservable.call('update', method.collectionName, method.query, method.update).subscribe(res => {
      });
    } else {
      let methodIndex = this.methodsToBeRun.findIndex(methodToBeRun => methodToBeRun._id == method._id);
      if (methodIndex >= 0) {
        this.methodsToBeRun[methodIndex] = method;
      }
      else {
        this.methodsToBeRun.push(method);
      }
    }
  }

  addAction(newAction) {
    let actionIndex = this.state.actionsToBeUploaded.findIndex(action => {
      if (action.documentId == newAction.documentId && action.field == newAction.field) {
        return true;
      }
    });
    if (actionIndex > -1) {
      this.state.actionsToBeUploaded[actionIndex] = newAction;
    } else {
      this.state.actionsToBeUploaded.push(newAction);
    }
  }

  generateActionFromMethod(method, row) {

    return {
      _id: Random.id(),
      documentId: row._id,
      collectionName: method.collectionName,
      document: row[method.document],
      type: 'update',
      field: method.fieldName,
      date: new Date(),
      value: this.objLocal['selectedRow'].newValue,
      previousValue: this.objLocal['selectedRow'].value,
      methodArgs: method.args,
      pathname: window.location.pathname
    };
  }

  removeModalFilter(event, filter) {
    let index = this.modalFilters.indexOf(filter);

    this.modalFilters.splice(index, 1);
    this.filterConditions = [];
    this.reloadData('removeModalFilter');

  }

  onReturn(row, column) {
    this.objLocal['selectedRow'] = row;

    if (this.isClick) {
      this.isClick = false;
      return;
    } else {
      if (this.returnable) {
        if (this.returnType == 'obj') {
          this.onSelected.emit(row);

        } else {
          let result = '';
          let selected = row;

          if (this.returnData) {

            this.returnData.forEach(field => {
              if (field in selected) {
                result += selected[field];
              } else {
                result += field;
              }
            })
          } else if ('methodName' in column) {
            let methodIndex = this.systemLookup.methods.findIndex(method => {
              if (method.name == column.methodName) {
                return true;
              }
            });

            let originMethod = Object.assign({}, this.systemLookup.methods[methodIndex]);

            originMethod.args = funcs.parseAll(originMethod.args, this.objLocal);

            let method = {
              _id: row._id + column.prop,
              rowId: row._id,
              name: originMethod.name,
              type: originMethod.type,
              collectionName: originMethod.collectionName,
              query: originMethod.args[0],
              update: originMethod.args[1]
            };

            this.runMethod(method);
          } else {
            result = selected;
          }
          this.onSelected.emit(result);
        }
        return;
      }
    }
  }

  updateContractProducts(row, column, checked) {

    let productId = row._id;
    const contractId = this.objLocal.data.contractId;
    let rowIndex = this.rows.findIndex(_row => _row._id == row._id);

    let update = {};
    let method: any = {};

    let checkboxFieldName = this.getCheckboxFieldName();
    if (checked) {
      if (this.rows[rowIndex][checkboxFieldName] == false) {
        let price: number;
        if (row['newHighlightField'] && row['newHighlightField'] != '') {
          price = row[row['newHighlightField']];
          if (price >= 0) {
            price = Number(price.toFixed(2));
          }
        }
        let obj: any = {
          _id: row._id,
          isSynced: false,
          createdAt: new Date(),
          createdUserId: Meteor.userId()
        };
        if (price >= 0) {
          obj.price = price;
        }

        update = {
          $addToSet: {
            products: obj
          }
        };

        method = {
          _id: row._id + '.' + this.systemLookup.dataTable.options.updatedFieldName,
          rowId: row._id,
          collectionName: 'customerContracts',
          query: { _id: contractId },
          update: update,
          type: 'update.insert'
        };
      }
    } else {
      update = {
        $pull: {
          products: {
            _id: productId
          }
        },
        $addToSet: {
          deletedProducts: productId
        }
      };
      method = {
        _id: row._id + '.' + this.systemLookup.dataTable.options.updatedFieldName,
        rowId: row._id,
        collectionName: 'customerContracts',
        query: { _id: contractId },
        update: update,
        type: 'update.remove'
      };
    }

    if (this.config.isReactiveUpdate) {
      MeteorObservable.call('update', 'customerContracts', { _id: contractId }, update).subscribe(res => {
      })
    } else {
      if (!funcs.isEmptyObject(method)) {

        let methodIndex = this.methodsToBeRun.findIndex(methodToBeRun => methodToBeRun._id == method._id);

        let logMessage;
        let log: any = {
          _id: Random.id(),
          documentId: contractId,
          collectionName: method.collectionName,
          document: contractId,
          type: 'update',
          field: 'products',
          log: '',
          date: new Date(),
          pathname: window.location.pathname
        };

        if (checked) {
          logMessage = `Add Product ${row.product} (${row._id}) (${this.objLocal.data.customer.number} (${this.objLocal.url.customerId}), ${this.objLocal.data.category.name} (${this.objLocal.url.categoryId}),)`;

        } else {
          logMessage = `Remove Product ${row.product} (${row._id}) (${this.objLocal.data.customer.number} (${this.objLocal.url.customerId}), ${this.objLocal.data.category.name} (${this.objLocal.url.categoryId}),)`;
        }

        log.log = logMessage;

        method.log = log;

        // find the method
        if (methodIndex >= 0) {
          // if it is checked by default in database, remove the
          if (this.rows[1][column.prop]) {
            // if check is true, dont'
            if (check) {

            }
          }
          this.methodsToBeRun[methodIndex] = method;
        }
        else {
          this.methodsToBeRun.push(method);
        }
      }
    }
  }

  async setPriceLevel(e, column) {
    // prevent ancestor's handlers from being executed
    e.stopPropagation();
    let checkboxFieldName = this.getCheckboxFieldName();

    let sameLevelCounts = 0;
    let highlightCounts = 0;
    this.exampleDatabase.value.forEach((row, index) => {
      if (row[checkboxFieldName]) {
        if (row['newHighlightField'] && row['newHighlightField'] != '') {
          highlightCounts++;
        }
        if (row['newHighlightField'] == column.prop) {
          sameLevelCounts++;
        }
      }
    });

    this.exampleDatabase.value.forEach((row, index) => {
      if (row[checkboxFieldName]) {
        if (highlightCounts == sameLevelCounts && highlightCounts != 0) {
          // equal, deselect all
          this.unSetPrice(e, row, column, index);
        } else {
          // not equal, set all same level
          this.objLocal['selectedRow'] = row;
          this.setPrice(e, row, column, index);
        }
      }
    });


    // this.exampleDatabase.value.forEach((row, index) => {
    //   if (row[checkboxFieldName]) {
    //     if (row['newHighlightField'] == column.prop) {
    //       sameLevelCounts++;
    //     }
    //     this.setPrice(e, row, column, index);
    //     // row['newHighlightField'] = column.prop;
    //     // if ('updateFieldName' in column) {
    //     //   row[column.updateFieldName] = row[column.prop];
    //     // }
    //   }
    // });
    // let path = "dataTable.options.controlFieldName";
    //
    // let updateArr = [];
    // this.rows.forEach(row => {
    //   updateArr.push({
    //     productId: row._id,
    //     value: Number(row[column.prop].toFixed(2)),
    //     allow: row[funcs.getObjectValue(this.systemLookup, path)]
    //   })
    // });
    // let contractId = await funcs.getContractIdByCustomerId(this.objLocal.url.customerId);
    //
    // updateArr.forEach(objUpdate => {
    //   let initRow = this.rows.find(initRow => {
    //     if (objUpdate.productId == initRow._id) {
    //       return true;
    //     }
    //   });
    //
    //   const query = {
    //     _id: contractId,
    //     "products._id": objUpdate.productId
    //   };
    //
    //   let update = {};
    //   if (initRow[column.fieldName] && initRow[column.fieldName] != "") {
    //     update = {
    //       $set: {
    //         "products.$.price": objUpdate.value,
    //         "products.$.previousPrice": initRow[column.fieldName],
    //         "products.$.isSynced": false
    //       }
    //     };
    //   } else {
    //     update = {
    //       $set: {
    //         "products.$.price": objUpdate.value,
    //         "products.$.isSynced": false
    //       }
    //     };
    //   }
    //
    //   const method = {
    //     _id: objUpdate.productId + column.prop,
    //     rowId: initRow._id,
    //     collectionName: 'customerContracts',
    //     query,
    //     update,
    //     type: 'update'
    //   };
    //   if (objUpdate.allow) {
    //     let methodIndex = this.methodsToBeRun.findIndex(methodToBeRun => methodToBeRun._id == method._id);
    //     if (methodIndex >= 0) {
    //       this.methodsToBeRun[methodIndex] = method;
    //     }
    //     else {
    //       this.methodsToBeRun.push(method);
    //     }
    //   }
    // });
    this.checkSaveButton();
  }

  checkSaveButton() {
    if (this.methodsToBeRun.length > 0) {
      this.state.isSaveButtonEnabled = true;
    } else {

      this.state.isSaveButtonEnabled = false;
    }
  }

  unSubscribe(subscriptions) {
    subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  cancelUpdate() {
    if (this.methodsToBeRun.length > 0) {
      if ('cancelLog' in this.systemLookup.dataTable.options) {
        let cancelLog = this.systemLookup.dataTable.options.cancelLog;
        let log: any = funcs.testParseParams(cancelLog, this.objLocal);

        Object.assign(log.value, { _id: Random.id(), date: new Date() });
        funcs.log(this.systemLog._id, log.value);
      }
    }

    this.methodsToBeRun = [];
    this.reloadData("cancel update");
  }

  getTemplateName(column) {
    let templateName = '';
    if (this.Device.isPhone()) {
      if ('showOnMobile' in column) {
        if (column.showOnMobile === true) {
          templateName = column.cellTemplate;
        } else {
          templateName = 'noShowTmpl';
        }
      } else {
        templateName = 'noShowTmpl';
      }
    } else {
      templateName = column.cellTemplate;
    }
    return templateName;
  }

  showColumn(column) {
    if (this.Device.isPhone()) {
      if ('showOnMobile' in column) {
        if (column.showOnMobile === true) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }

    } else {
      return true;
    }
  }

  async allResults() {
    let method = this.methodArgs[0];
    method = this.removeLimitAndSkip(method);
    let allResults = await funcs.callbackToPromise(MeteorObservable.call('aggregate', this.systemLookup.methods[0].collectionName, method));
    return allResults;
  }

  async PDF() {
    let allResults = await this.allResults()
    let totals = await this.calculateTotals(allResults)
    let pdfContent = {
      lookup: this.systemLookup,
      result: allResults['result']
    }

    if (totals) {
      pdfContent['totals'] = totals;
    }

    let docDefinition = funcs.reportPdf(pdfContent);
    pdfMake.createPdf(docDefinition).open();
  }

  async summary() {
    let allResults = await this.allResults()
    let totals = await this.calculateTotals(allResults)

    let columns = this.systemLookup.dataTable.columns;
    let totalObject = {};
    let totalArray = [];
    for (let key in totals) {
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].prop === key) {
          totalArray.push({
            title: columns[i].prop,
            total: totals[key]
          })
          // totalObject[key] = {
          //   title: columns[i].prop,
          //   total: totals[key]
          // }
        }
      }
    }
  }

  removeLimitAndSkip(pipeline) {
    let removeValFromIndex = [];
    let arr = pipeline;
    arr.forEach((element, index, object) => {
      if ('$limit' in element || '$skip' in element) {
        removeValFromIndex.push(index)
      }
    });
    for (let i = removeValFromIndex.length - 1; i >= 0; i--) {
      arr.splice(removeValFromIndex[i], 1)
    }
    return arr;
  }

  async calculateTotals(allRows) {
    if (this.methods[0]) {
      let method = this.methodArgs[0];
      let args = this.methods[0].args[0];
      method = this.removeLimitAndSkip(method);
      if ('totalLogic' in this.systemLookup) {
        let totalLogic = funcs.parseAll(this.systemLookup.totalLogic, this.objLocal);
        let totalArray = method.concat(totalLogic[0]);
        let allResults = await funcs.callbackToPromise(MeteorObservable.call('aggregate', this.systemLookup.methods[this.systemLookup.methods.length - 1].collectionName, totalArray));
        let totalObject = allResults['result'][0];
        if (totalObject) {
          delete totalObject['_id'];
          return totalObject;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  removeMethodToBeRun(query) {
    let index = this.methodsToBeRun.findIndex(method => {
      return method._id == query._id
    });
    this.methodsToBeRun.splice(index, 1);
  }

  async checkRow(row, checkboxFieldName) {
    //   await this.updateContractProducts(row, column, event.checked);
    let rowIndex = this.rows.findIndex(_row => _row._id == row._id);

    this.exampleDatabase.value[rowIndex][checkboxFieldName] = true;

    let isRowCheckedInDatabase = this.rows[rowIndex][checkboxFieldName];
    if (isRowCheckedInDatabase) {
      // if this row is checked in the database, no need to check it again, remove the methodToBeRun
      this.exampleDatabase.value[rowIndex].backgroundColor = '';
      const query = {
        _id: row._id + '.' + checkboxFieldName
      };
      this.removeMethodToBeRun(query);
    } else {
      this.exampleDatabase.value[rowIndex].backgroundColor = 'green';
      // if it is not in the database, check it, and add the method
      if (this.systemLookup.category == 'contractPricing') {
        // await this.updateContractProducts(row, this.columns[columnIndex], true);
      } else {

      }
    }
  }

  async unCheckRow(row, checkboxFieldName) {
    row['newHighlightField'] = '';
    let rowIndex = this.rows.findIndex(_row => _row._id == row._id);
    let columnIndex = this.columns.findIndex((column) => column.prop == checkboxFieldName);

    this.exampleDatabase.value[rowIndex][checkboxFieldName] = false;

    let isRowCheckedInDatabase = this.rows[rowIndex][checkboxFieldName];

    if (isRowCheckedInDatabase) {
      // if this row is checked in the database
      this.exampleDatabase.value[rowIndex].backgroundColor = 'red';
      if (this.systemLookup.category == 'contractPricing') {
        this.updateContractProducts(row, this.columns[columnIndex], false);
      } else {

      }
    } else {
      this.exampleDatabase.value[rowIndex].backgroundColor = '';
      // if it is not in the database, there is no need to uncheck it, remove the method in the methodsToBeRun
      const query = {
        _id: row._id + '.' + checkboxFieldName
      };
      this.removeMethodToBeRun(query);
    }
  }

  async unCheckAll() {
    if ('checkboxFieldName' in this.systemLookup.dataTable.options) {
      let checkboxFieldName = this.systemLookup.dataTable.options.checkboxFieldName;
      await Promise.all(this.exampleDatabase.value.map(async (row, index) => {
        if (row[checkboxFieldName]) {
          await this.unCheckRow(row, checkboxFieldName);
        }
      }));
      this.checkSaveButton();
    }
  }

  async checkAll() {
    if ('checkboxFieldName' in this.systemLookup.dataTable.options) {
      let checkboxFieldName = this.systemLookup.dataTable.options.checkboxFieldName;
      await Promise.all(this.exampleDatabase.value.map(async (row) => {
        if (!row[checkboxFieldName]) {
          await this.checkRow(row, checkboxFieldName);
        }
      }));
      this.checkSaveButton();
    }
  }

  addModalFilters() {
    if (this.modalFilters.length > 0) {
      this.modalFilters.forEach((modalFilter) => {
        const obj = {
          field: modalFilter.prop,
          method: "$regex",
          value: modalFilter.value
        };
        this.filterConditions.push(obj);
      })
    }
  }

  returnPristineRows() {
    // return pristine rows in the table
    return this.rows;
  }

  returnDirtyRows() {
    // return dirty rows in the table
    return this.exampleDatabase.value;
  }

  ngOnDestroy() {
    this.methods = [];
    this.unSubscribe(this.subscribeSubscriptions);
    this.unSubscribe(this.autorunSubscriptions);

    this.unSubscribe(this.observeSubscriptions);
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}

@Component({
  selector: 'dialog-Select',
  templateUrl: 'template1.html'
})

export class DialogSelect {
  constructor(public dialogRef: MatDialogRef<DialogSelect>) { }
}


export class ExampleDataSource extends DataSource<any> {
  constructor(public _database: any) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect() {

    const displayDataChanges = [
      this._database
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      return this._database.value;
    });
  }

  disconnect() { }
}