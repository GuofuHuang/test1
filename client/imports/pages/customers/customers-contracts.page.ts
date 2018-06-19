import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogComponent } from "../../modules/shared-module/dialog/dialog.component";
import {ActivatedRoute, Router} from '@angular/router';
import * as funcs from '../../../../both/functions/common';

import {MeteorObservable} from "meteor-rxjs";

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as moment from 'moment';
import {Session} from "meteor/session";
import * as systemConfig from '../../../../both/config/systemConfig';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {PageResolver} from "../../resolvers/PageResolver";
import { Random } from 'meteor/random';
import {NotificationsService} from "angular2-notifications";

import { CustomersService } from "./customers.service";
import {EventEmitterService} from "../../services";
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'customers-contracts',
  templateUrl: 'customers-contracts.page.html',
  styleUrls: ['customers.scss'],
  providers: [NotificationsService]
})

export class CustomersContractsPage implements OnInit, OnDestroy{

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private _router: Router,
    private _service: NotificationsService,
    private _customerService: CustomersService,
    private _fb: FormBuilder,
  ) {
    pdfFonts.pdfMake
  }


  @ViewChild('contractPricing') contractPricing;

  public options = systemConfig.alertOptions;
  progressPercentage = 0;
  normalTableData: any;
  isDeveloper;
  filterConditions: any;
  isDataTableLoading: boolean = false;
  enableCheckUpdate = true;
  isSyncing = false;

  years = systemConfig.years;
  sub: Subscription;
  config = {
    enableMultipleUsersUpdate: true
  };
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true,
    gt: new Date(),
    customerId: null,
    categoryId: null
  };
  customerLabel:string;
  categoryLabel:string;
  products: any[] = [];
  email: any[] = [];
  state: any = {};
  syncText = 'Please wait......';

  contractForm: FormGroup;
  isTestWebsite: false;

  columns: any;
  displayedColumns: any;

  fullCustomerContract: any;
  productInContract: boolean = true;
  viewAll: boolean = false;
  pdfLoading: boolean = false;

  init() {
    Session.set('eventName', '');
    Object.assign(this.state, {
      view: '',
      categoryId: '',
      customerId: '',
      contractId: '',
      contractCategory: {},
      customer: {},
      categories: [],
      category: {},
      doc: {},
      currentPriceTag: 'contractPrice',
      newPriceTag: '',
      copyContract: {
        fromCustomer: {},
        fromCustomerLabel: '',
        toCustomerLabel: '',
        selectedToCustomer: {},
        toCustomersList: [],
        increasePercentage: 0,
        copyData: {
          contractId: ''
        }
      },
      updateContract: {
        selectedCustomers: [],
        increasePercentage: 0
      },
      queryParams: {}
    });
    this.customerLabel = '';
    this.categoryLabel = '';
  }

  hookEvents() {
    let events = [];
    let pageRoute = PageResolver.getCurrentPageRoute();
    if (pageRoute.data  && 'buttons' in pageRoute.data) {
      pageRoute.data.buttons.forEach(button => {
        if ('eventName' in button) {
          events.push(button.eventName);
        }
      })
    }
    if (events.length > 0) {
      this.sub = EventEmitterService.Events.subscribe(async (eventName) => {
        switch(eventName) {
          case 'generatePDF':
            this.pdf();
            break;
          case 'copy':
            if (!funcs.isEmptyObject(this.state.customer)) {
              await this.setFromCustomer(this.state.customer);
            } else {
              this.unsetFromCustomer();
            }
            this.showView('copy');
            break;
          case 'bulkUpdate':
            CustomersService.increasePercentage = 0;
            CustomersService.isSlideChecked = false;
            CustomersService.selectedCustomers = [];
            if (!funcs.isEmptyObject(this.state.customer)) {
              CustomersService.selectedCustomers.push(this.state.customer);
            }

            this.showView('update');
            break;
          default:
            break;
        }
      })
    }
  }

  async ngOnInit() {
    this.isTestWebsite = Meteor.settings.public.isTestWebsite;
    this.init();

    this.hookEvents();
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

    this.isDeveloper = PageResolver.isDeveloper;

    this.columns = [
      {
        prop: 'year',
        name: 'Year',
        cellTemplate: 'qtyTmpl'
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


    this.route.queryParams.subscribe(async (params) => {

      let params_copy = Object.assign({}, params);
      this.state.view = params.view;

      delete params_copy.view;
      if (Object.keys(params_copy).length == 0) {
        if (this.state.view == '' || !this.state.view) {
          this.init();
        }
      }
      let compareResult = funcs._isObjectChangedAll(params, this.state.queryParams);

      if (compareResult) {
        this.state.queryParams = params_copy;
        let urlParams:any = funcs.parseUrlParams(params);
        let newState = {};
        Object.assign(newState, urlParams);
        const isChanged = funcs._isObjectChanged(this.state, newState, ['categoryId', 'customerId', 'startYear']);
        await this.parseUrlKeys(urlParams);
        if (isChanged) {
          if (!funcs.isEmptyObject(urlParams)) {
            if ('customerId' in urlParams && 'categoryId' in urlParams) {
              this.setYear(urlParams);
            } else {

            }
          }

          if (this.state.customerId && this.state.categoryId && this.state.startYear)
            this.setLoading(false);
          Session.set('enableCheckUpdate', true);
        } else {
          Session.set('enableCheckUpdate', false);
        }
      } else {
        this.setLoading(false);
      }

      // if (this.state.view == 'copy') {
      //   if (Session.get('eventName') == 'fab') {
      //     if (!funcs.isEmptyObject(this.state.customers)) {
      //       this.setFromCustomer(this.state.customers);
      //     } else {
      //       this.unsetFromCustomer();
      //     }
      //   }
      // }
    });

    MeteorObservable.call('checkUserPermission', Meteor.userId(), 'viewAllContractPricing').subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.viewAll = true;
      } else {
      }
    });
  }

  async parseUrlKeys(urlParams) {
    await Promise.all(Object.keys(urlParams).map(async(key) => {

      let result:any;
      switch(key) {
        case 'customerId':
          result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'customers', {_id: urlParams[key]}));
          Object.assign(this.data, {customer: result});
          await this.setCustomer(result);
          break;
        case 'categoryId':
          result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'categories', {_id: urlParams[key]}));
          if (result) {
            Object.assign(this.data, {category: result});

            let category = result;
            this.state.category = category;
            this.state.categoryId = this.state.category._id;
            this.categoryLabel = category.name + " - " + category.description;
            this.state.categories = funcs._addObjectToArray(category, '_id', this.state.categories);

          }
          break;
        case 'categoryIds':
          if ((typeof urlParams[key]) == 'string') {
            result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'categories', {_id: urlParams[key]}));
            if (result) {
              let category = result;
              this.state.categories = funcs._addObjectToArray(category, '_id', this.state.categories);
            }
          } else {
            if (!('categories' in this.state)) {
              this.state.categories = [];
            }
            await Promise.all(urlParams[key].map(async (categoryId) => {
              result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'categories', {_id: categoryId}));
              if (result) {
                let category = result;
                this.state.categories = funcs._addObjectToArray(category, '_id', this.state.categories);
              }

            }));
          }
          break;
        case 'startYear':
          this.state.selectedYear = Number(urlParams[key]);
          break;
      }
    }));
    if (!('startYear' in urlParams)) {
      this.state.selectedYear = systemConfig.years[0];
      if (this.state.customerId && this.state.categoryId) {
        this.state.startYear = this.state.selectedYear;
        this.state.endYear = this.state.selectedYear + 1;
      }
    }
  }

  setLoading(value) {
    if (this.state.view == '' || this.state.view == undefined) {
      if (this.state.categories.length > 0 && this.state.customerId && this.state.customerId != '') {
        this.isDataTableLoading = value;
      } else {
        this.isDataTableLoading = false;
      }
    }
  }

  getModalData(data) {

  }

  setYear(urlParams) {
    Object.keys(urlParams).forEach(key => {
      if (key == 'startYear') {
        this.state.selectedYear = Number(urlParams[key]);
      }
    });
    const years = [this.state.selectedYear, this.state.selectedYear-1];

    this.normalTableData.rows = [];
    years.forEach(async(year=2017) => {
      const result:any = await funcs.getCustomerCategorySales(year, urlParams.customerId, urlParams.categoryId);

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
    });

    this._router.navigate([], {queryParams: {"url.startYear": this.state.selectedYear, "url.endYear": this.state.selectedYear + 1}, queryParamsHandling: 'merge'});
  }

  selectCustomer() {
    let dialogRef = this.dialog.open(DialogComponent, {
      height: '600px',
      width: '800px',
    });
    dialogRef.componentInstance.lookupName = 'customers';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.navigateCustomer(result);
        // Object.assign(this.data, {customerId: result._id});

        // this._router.navigate([], {queryParams: {'url.customerId': result._id}, queryParamsHandling: 'merge'});
      }
    })
  }

  getCustomer(customer) {
    this.showMainContent();
    this.navigateCustomer(customer);
  }

  addUpdatedCustomers(customer) {
    let customerIds = CustomersService.selectedCustomers.map(customer => {
      return customer._id;
    });

    if (customerIds.indexOf(customer._id) == -1) {
      CustomersService.selectedCustomers.push(customer);
    }
    CustomersService.selectedCustomers = funcs._sort(CustomersService.selectedCustomers, 'customer');

    this.showView('update');
  }

  addToCustomer(customer) {
    this.state.copyContract.selectedToCustomer = customer;
    let newState = {
      isToCustomerListShown: false,
      isCopyContractShown: true,
    };

    let copyContract = {
      toCustomerLabel: customer.customer + ' - ' + customer.name
    };

    let customerIds = this.state.copyContract.toCustomersList.map(customer => {
      return customer._id;
    });
    if (customerIds.indexOf(customer._id) === -1) {
      this.state.copyContract.toCustomersList.push(customer);
    }

    this.state.copyContract.toCustomersList = funcs._sort(this.state.copyContract.toCustomersList, 'customer');

    Object.assign(this.state, newState);
    Object.assign(this.state.copyContract, copyContract);
    this.showView('copy');
  }

  async onSelectFromCustomer(customer) {
    await this.setFromCustomer(customer);
    this.showView('copy');
  }

  async setFromCustomer(customer) {
    let copyContract = {
      fromCustomerLabel: customer.customer + ' - ' + customer.name
    };

    let contractId = await funcs.getContractIdByCustomerId(customer._id);

    this.state.copyContract.copyData = {
      contractId: contractId
    }
    Object.assign(this.state.copyContract, copyContract);
  }

  unsetFromCustomer() {
    let copyContract = {
      fromCustomer: {},
      fromCustomerLabel: '',
      toCustomerLabel: '',
      selectedToCustomer: {},
      toCustomersList: [],
      increasePercentage: 0,
      copyData: {
        contractId: ''
      }
    };
    Object.assign(this.state.copyContract, copyContract);
  }

  setCategory(category) {
    this.showMainContent();
    this.processCategory(category);
  }

  selectProductLine() {
    let dialogRef = this.dialog.open(DialogComponent, {
      height: '600px',
      width: '800px',
    })
    dialogRef.componentInstance.lookupName = 'selectCategory';
    dialogRef.componentInstance.data = {
      value: {
        $in: [null, false]
      },
      hidden: true
    };

    dialogRef.afterClosed().subscribe(async(result) => {
      if (result) {

        let categoryIds = this.state.categories.map(category => {
          return category._id;
        });
        if (categoryIds.indexOf(result._id) === -1) {
          this.setLoading(true);
          this.state.categories.push(result);
        }
        this.state.categories = funcs._sort(this.state.categories, 'name');

        categoryIds = this.state.categories.map(category => {
          return category._id;
        });
        let routeParams:any = await funcs.callbackToPromise(this.route.queryParams);
        let queryParams:any = {};
        Object.assign(queryParams, routeParams);

        if ('keywords' in queryParams) {
          delete queryParams.keywords;
        }
        queryParams['url.categoryIds'] = categoryIds;
        queryParams['url.categoryId'] = result._id;

        this._router.navigate([], {queryParams});
      }
    })
  }

  async processCategory(result) {
    if (result) {
      Object.assign(this.data, {category: result});
      let categoryIds = this.state.categories.map(category => {
        return category._id;
      });
      if (categoryIds.indexOf(result._id) === -1) {
        this.setLoading(true);
        this.state.categories.push(result);
      }
      this.state.categories = funcs._sort(this.state.categories, 'name');
      categoryIds = this.state.categories.map(category => {
        return category._id;
      });
      let routeParams:any = await funcs.callbackToPromise(this.route.queryParams);
      let queryParams:any = {};
      Object.assign(queryParams, routeParams);

      delete queryParams.keywords;
      delete queryParams.view;

      queryParams['url.categoryIds'] = categoryIds;
      queryParams['url.categoryId'] = result._id;

      this._router.navigate([], {queryParams, queryParamsHandling: 'merge'});
    }
  }

  async setCustomer(customer) {
    this.state.customer = customer;
    this.state.customerId = customer._id;
    this.customerLabel = this.state.customer.customer + ' - ' + this.state.customer.name;
    this.state.contractId = await funcs.getContractIdByCustomerId(customer._id);
    let result:any = await funcs.getContractCategory(this.state.contractId, this.state.categoryId);

    if (result.length > 0) {
      this.state.contractCategory = result[0];
    } else {
      this.state.contractCategory = {
        priceLevel5Percent: 0
      }
    }

    Object.assign(this.data, {contractId: this.state.contractId});
    // Object.assign(this.urlParams, {customerId: customers._id, contractId: this.state.contractId});

  }

  navigateCustomer(customer) {

    if (!funcs.isEmptyObject(customer)) {
      Object.assign(this.data, customer);
    }
    this._router.navigate([], {queryParams: {'url.customerId': customer._id, view: ''}, queryParamsHandling: 'merge'});
  }

  addCategory(category) {

    this.state.categories = funcs._addObjectToArray(category, '_id', this.state.categories);
    let result = funcs.sortArrayByKey(this.state.categories, 'name');
  }

  navigateCategory(category) {
    let queryParams = this.generateUrlParams();
    Object.assign(queryParams, {"url.categoryId": category._id});
    delete queryParams.sort;
    this.contractPricing.reloadTable();
    this._router.navigate([], {queryParams});
  }

  async onPercentageChange(field, event) {
    let query = {
      _id: this.state.category._id
    };
    let update = {
      $set: {
        [field]: parseFloat(event.target.value)
      }
    };
    await funcs.update('categories', query, update);
  }

  async onLevel5Change(e) {
    Session.set('enableCheckUpdate', true);
    let query:any = {
      _id: this.state.contractId,
      "categories._id": this.state.categoryId
    };
    if (!this.state.contractCategory.priceLevel5Percent) {
      this.state.contractCategory.priceLevel5Percent = 0;
    }

    const docs:any = await funcs.callbackToPromise(MeteorObservable.call('find', 'customerContracts', query));
    let update:any ={};
    if (docs.length > 0) {
      update = {
        "$set": {
          "categories.$.priceLevel5Percent": this.state.contractCategory.priceLevel5Percent
        }
      };
    } else {
      query = {
        _id: this.state.contractId
      };
      update = {
        $addToSet: {
          categories: {
            _id: this.state.categoryId,
            priceLevel5Percent: this.state.contractCategory.priceLevel5Percent
          }
        }
      };
    }

    let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'customerContracts', query, update));
    if (result) {
      this.contractPricing.reloadData('Category 5 changes ');
    }
  }



  removeCategory(category) {
    // remove the category from array
    this.state.categories = this.state.categories.filter(addedCategory => {
      if (addedCategory._id != category._id) {
        return true;
      }
    });

    // update categoryIds array
    this.state.categoryIds = this.state.categories.map(category => category._id);

    // if remove the current category
    if (this.state.category._id == category._id) {

      if (this.state.categories.length > 0) {
        // Session.set('enableCheckUpdate', true);
        this.navigateCategory(this.state.categories[0]);
      } else {

        // Session.set('enableCheckUpdate', false);
        this.state.categoryId = null;
        this.state.category = null;
        this.data.categoryId = null;
        this.categoryLabel = '';
        this.setLoading(false);
        this.state.startYear = null;
        let queryParams = this.generateUrlParams();
        this._router.navigate([], {queryParams});
      }
    } else {
      Session.set('enableCheckUpdate', false);
      this._router.navigate([], {queryParams: this.generateUrlParams()});
    }
  }

  generateUrlParams() {
    // generate query params
    let queryParams:any = {
      'url.customerId': this.state.customerId,
    };
    if (this.state.categories.length > 0) {
      this.state.categoryIds = this.state.categories.map(category => category._id);
      queryParams['url.categoryIds'] = this.state.categoryIds;
    }

    if (this.state.startYear) {
      queryParams['url.startYear'] = this.state.startYear;
      queryParams['url.endYear'] = this.state.endYear;
    }

    if (!funcs.isEmptyObject(this.state.category)) {
      queryParams['url.categoryId'] = this.state.category._id;
    }

    return queryParams;
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch(action.type) {
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

  checkIfInContract(customerAndCategoryIds){
    MeteorObservable.call('getFullContract', customerAndCategoryIds).subscribe((contract) => {
      if (contract['result'].length > 0) {
        this.productInContract = true;
      } else {
        this.productInContract = false;
      }
    });
  }

  pdf() {
    this.pdfLoading = true;
    let categories = this.state.categories;
    let categoriesArr = [];

    for (var i = 0; i < categories.length; i++) {
      categoriesArr.push(categories[i]._id)
    }

    let customerAndCategoryIds = {
      customerId: this.state.customer._id,
      categoryId: categoriesArr
    };

    let log = {
      log: "Press PDF button",
      collectionName: "PDF Button",
      document: window.location.pathname,
      date: new Date(),
      _id: Random.id()
    };
    funcs.log(PageResolver.systemLog._id, log);


    MeteorObservable.call('getFullContract', customerAndCategoryIds).subscribe((contract) => {
      if (contract) {
        this.fullCustomerContract = contract;
        let log = {
          log: "Generate PDF success",
          collectionName: "PDF Button",
          document: window.location.pathname,
          date: new Date(),
          _id: Random.id()
        };
        funcs.log(PageResolver.systemLog._id, log);
      }
      let pdfInfo = {
        customer: this.customerLabel,
        content: this.fullCustomerContract.result,
      };
      let docDefinition = funcs.pdfContentArray(pdfInfo);      
      if (customerAndCategoryIds.categoryId) {
        pdfMake.createPdf(docDefinition).download(this.customerLabel + ' Price Sheet-' + moment().format("MM/DD/YYYY-h:mma") + '.pdf');
      } else {
        pdfMake.createPdf(docDefinition).download(this.customerLabel + ' Full Price Sheet-' + moment().format("MM/DD/YYYY-h:mma") + '.pdf')
      }
      this.pdfLoading = false;
    });
  }

  onMobileClick(doc) {

    this.state.isMainContentShown = false;
    this.state.isSingleDocumentShown = true;
    this.state.doc = doc;
    this.state.newPriceTag = '';

    this.contractForm = this._fb.group({
      isOnContract: [doc.isOnContract, <any>Validators.required],
      product: [doc.product, <any>Validators.required],
      description: [doc.description],
      YTDsales: [doc.YTDsales, <any>Validators.required],
      STDcost: [doc.STDcost, <any>Validators.min(0)],
      vendorCost: [doc.vendorCost, <any>Validators.min(0)],
      STDprice: [doc.STDprice, <any>Validators.min(0)],
      previousPrice: [doc.previousPrice, <any>Validators.min(0)],
      contractPrice: [doc.contractPrice, <any>Validators.min(0)],
      level1: [Number((doc.level1).toFixed(2))],
      level2: [Number((doc.level2).toFixed(2))],
      level3: [Number((doc.level3).toFixed(2))],
      level4: [Number((doc.level4).toFixed(2))],
      level5: [Number((doc.level5).toFixed(2))]
    });

    this.findRightBackgroundColor();
  }

  setContractPrice(str) {
    this.state.newPriceTag = str;
    // this.state.currentPriceTag = str;
  }

  showMainContent() {
    this._router.navigate([], {queryParams: {view: ''}, queryParamsHandling: 'merge'})
  }

  showView(view) {
    this._router.navigate([], {queryParams: {view}, queryParamsHandling: 'merge'})
  }

  toggleContractDocument() {
    this.state.isMainContentShown = !this.state.isMainContentShown;
    this.state.isSingleDocumentShown = !this.state.isSingleDocumentShown;
  }

  updateContractPrice() {

    if (this.state.newPriceTag != '') {
      let query = {
        _id: this.state.contractId,
        "products._id": this.state.doc._id
      };

      let update = {
        $set: {
          "products.$.price": Number(this.contractForm.controls[this.state.newPriceTag].value),
          "products.$.previousPrice": this.state.doc.contractPrice,
          "products.$.isSynced": false,
        }
      };

      MeteorObservable.call('update', 'customerContracts', query, update).subscribe(res => {

        if (res) {
          this.contractForm.controls['contractPrice'].patchValue(Number(this.contractForm.value[this.state.newPriceTag]));
          this.state.currentPriceTag = this.state.newPriceTag;
          this.state.newPriceTag = '';
          this.findRightBackgroundColor();
        }
      });
    }
  }

  findRightBackgroundColor() {
    switch(this.contractForm.controls['contractPrice'].value)
    {
      case this.contractForm.controls['level1'].value:
        this.state.currentPriceTag = 'level1';
        break;
      case this.contractForm.controls['level2'].value:
        this.state.currentPriceTag = 'level2';
        break;
      case this.contractForm.controls['level3'].value:
        this.state.currentPriceTag = 'level3';
        break;
      case this.contractForm.controls['level4'].value:
        this.state.currentPriceTag = 'level4';
        break;
      case this.contractForm.controls['level5'].value:
        this.state.currentPriceTag = 'level5';
        break;
      default:
        this.state.currentPriceTag = 'contractPrice';
        break;
    }
  }

  syncDatabase() {
    this.isSyncing = true;
    this.syncText = 'Please wait......';
    const collections = [
      'products',
      'categories',
      'customers',
      'customerContracts',
    ];
    let count = 0;
    let length = collections.length;
    Promise.all(collections.map((collectionName) => {
      return new Promise(resolve => {
        MeteorObservable.call('syncDatabase', collectionName).subscribe((res) => {
          if (res) {
            count++;
            this.progressPercentage = count/length * 100;
            resolve(true);
          }
        });
      })
    })).then(res => {
      this.syncText = 'Done';
      setTimeout(() => {
        this.isSyncing = false;
      }, 3000);
    });
  }

  _showContractId() {
    let isDeveloper = PageResolver.isDeveloper;
    if (isDeveloper) {
      return this.state.contractId;
    }
  }

  ngOnDestroy() {
    // EventEmitterService.Events.unsubscribe();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
