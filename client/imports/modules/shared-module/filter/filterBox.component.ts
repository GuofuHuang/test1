import { Component, OnInit, OnDestroy, Output, Input, EventEmitter, ViewChild } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { Subscription } from 'rxjs/Subscription';
import { Router, ActivatedRoute } from '@angular/router';

import {MeteorObservable} from "meteor-rxjs";
import { FilterService } from './filter.service';
import * as types from './actionTypes';
import { UserFilters } from '../../../../../both/collections/userFilters.collection';
import {FilterDetailComponent} from "./filterDetail.component";
import {getParameterByName, callbackToPromise} from '../../../../../both/functions/common';
import * as deleteFuncs from '../../../../../both/functions/delete';

@Component({
  selector: 'filterBox-component',
  templateUrl: 'filterBox.component.html',
  styleUrls: [ 'filter.scss' ],
  providers: [FilterService]
})

export class FilterBoxComponent implements OnInit, OnDestroy {
  @Output() filter = new EventEmitter<any>();
  @Output() modalData = new EventEmitter<any>();

  @Input() lookupName:string;
  @Input() isModal:boolean = false;
  @ViewChild(FilterDetailComponent) filterDetail: FilterDetailComponent;

  selectedFilter:any = {
    _id: '',
    name: ''
  }; // selected filter to display in filter detail componenty

  test: string;
  addedFilters; // added filters to filter datatable
  selectedSavedFilter: any; // selected filter from saved filters

  subscriptions: Subscription[] = [];

  defaultIndex: number = 0;
  state:any = {
    isDetailHidden: true,
    addedFilters: [],
    selectedFilter: {},
    savedFilters: {},
    columns: [],
    view: ''
  };

  constructor(private _service: NotificationsService, private _router: Router, private _route: ActivatedRoute) {}

  ngOnInit() {
    this.onInit();
  }

  async onInit() {

    this.getSavedFilters();

    let sub;
    // get columns
    sub = MeteorObservable.autorun().subscribe(async () => {
      if (Session.get('parentTenantId')) {
        let query = {
          name: this.lookupName,
          parentTenantId: Session.get('parentTenantId')
        };

        let result:any = await callbackToPromise(
          MeteorObservable.call('findOne', 'systemLookups', query, {})
        );
        this.state.columns = result.dataTable.columns;
        this.state.columns = this.state.columns.filter(column => column.type != 'actions' && column.hidden === false);
      }
    });

    this.subscriptions.push(sub);
    this.getAddedFiltersFromUrl();
  }

  getAddedFiltersFromUrl() {
    this._route.queryParams.subscribe(async(params) => {
      let filterIds;

      if ('filters' in params) {
        filterIds = params['filters'];
        let query:any = {};
        if (typeof filterIds == 'string') {
          query._id = filterIds;
        } else {
          query._id = {$in: filterIds};
        }
        let res:any = await callbackToPromise(
          MeteorObservable.call('find', 'userFilters', query)
        );
        res.forEach(filter => {
          let index = this.state.addedFilters.findIndex(addedFilter => addedFilter._id == filter._id);
          if (index < 0) {
            this.state.addedFilters.push(filter);
          }
        });
      } else if ('view' in params) {
        this.state.view = params['view'];
      }
    })
  }

  getSavedFilters() {
    let sub = MeteorObservable.subscribe('userFilters', {}, {}, '').subscribe();
    this.subscriptions.push(sub);
    MeteorObservable.autorun().subscribe(() => {
      if (Session.get('parentTenantId')) {
        let query = {
          parentTenantId: Session.get('parentTenantId'),
          lookupName: this.lookupName
        };
        this.state.savedFilters = UserFilters.collection.find(query).fetch();
      }
    });
  }

  onSelectFilter() {
    this.reducers({type: types.ADD_NEW_FILTER, value: {filter: this.state.selectedSavedFilter}})
  }

  addFilter(filter) {
    if (filter) {
      let length = this.state.addedFilters.length;

      let index = -1;
      if ('_id' in filter) {
        index = this.state.addedFilters.findIndex(addedFilter => {
          return addedFilter['_id'] == filter['_id'];
        });
      }
      if (index < 0) {
        this.state.addedFilters.push(filter);
        let filterIds = this.state.addedFilters.map(addedFilter => {
          return addedFilter._id;
        });
        let queryParams = this.generateQueryParams(this.state.addedFilters);

        if (this.isModal) {
          this.modalData.emit(queryParams);
        } else {
          this._router.navigate([], {queryParams, queryParamsHandling: 'merge'});
        }
      } else {
        this._service.success(
          'Alert',
          ' already added'
        );
      }

    } else {
      this._service.alert(
        'Alert',
        'Please select a filter'
      )
    }
  }

  generateQueryParams(addedFilters) {
    let queryParams:any = {};
    queryParams.filters = [];

    this.state.addedFilters.forEach(addedFilter => {
      queryParams.filters.push(addedFilter._id);
      addedFilter.conditions.forEach(condition => {
        let key = condition.column;
        queryParams[key] = condition.method + "." + condition.value;
      });
    });
    let result = this._route;
    return queryParams;
  }

  applyFilter(filter) {

    let length = this.state.addedFilters.length;

    let index = -1;
    if ('_id' in filter) {
      index = this.state.addedFilters.findIndex(addedFilter => {
        return addedFilter['_id'] == filter['_id'];
      });
    }
    if (index < 0) {
      this.state.addedFilters.push(filter);
    } else {
      this.state.addedFilters[index] = filter;
    }

    let queryParams = this.generateQueryParams(this.state.addedFilters);

    if (this.isModal) {
      this.modalData.emit(queryParams);
    } else {
      this._router.navigate([], {queryParams, queryParamsHandling: 'merge'});
    }
  }

  addNewFilter() {
    this.state.selectedFilter = {
      _id: this.defaultIndex,
      conditions: [{}]
    };
    this.state.isDetailHidden = false;
      this.defaultIndex++;
  }

  removeAddedFilter(filter) {
    let index = this.state.addedFilters.indexOf(filter);
    this.state.addedFilters.splice(index, 1);
    let result = this.filterDetail.removeAddedFilter(filter);
    if (result) {
      this.state.isDetailHidden = true;
    }
    let queryParams = this.generateQueryParams(this.state.addedFilters);

    let keywords = getParameterByName('keywords');
    if (keywords) {
      queryParams.keywords = keywords;
    }

    if (this.isModal) {
      this.modalData.emit(queryParams);
    } else {
      this.navigateTo(queryParams);
      // this._router.navigate([], {queryParams,});
    }
  }

  navigateTo(queryParams) {
    if (this.state.view != '') {
      Object.assign(queryParams, {view: this.state.view});
      }
    this._router.navigate([], {queryParams});
  }

  showFilterDetail(filter) {
    this.filterDetail.onFilterChange(filter);
    this.state.isDetailHidden = false;
  }

  deleteSavedFilter(filter) {
    deleteFuncs.deleteUserFilter(filter.name, filter.lookupName, Session.get('parentTenantId'));
    this.removeAddedFilter(filter);

  }

  reducers(action) {
    switch(action.type) {
      case types.HIDE_FILTER_DETAIL_COMPONENT:
        this.state.isDetailHidden = true;
        return ;
      case types.SHOW_FILTER_DETAIL_COMPONENT:
        this.state.isDetailHidden = false;
        return ;
      case types.ADD_NEW_FILTER:
        this.addFilter(action.value.filter);
        this.state.selectedSavedFilter = {};
        this.state.isDetailHidden = true;

        return ;
      case types.APPLY_FILTER:
        this.applyFilter(action.value.filter);
        this.state.isDetailHidden = true;

        return;
      case types.DELETE_FILTER:
        this.deleteSavedFilter(action.value.filter);
        this.state.isDetailHidden = true;

        return;
      case types.SAVE_NEW_FILTER:
        this.state.selectedFilter = action.value.filter;
        this.applyFilter(action.value.filter);
        this.state.isDetailHidden = true;
        return  ;
      case types.SAVE_FILTER:
        this.state.selectedFilter = action.value.filter;
        this.state.isDetailHidden = true;
        this.applyFilter(action.value.filter);
        return  ;
      default:
        return ;
    };
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      // sub.unsubscribe();
    });
    this.state.addedFilters = [];
  }
}