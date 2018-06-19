import { Component, OnInit, OnDestroy, Input, Output, OnChanges, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';

import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from 'rxjs/Subscription';
import { UserFilter } from '../../../../../both/models/userFilter.model';
import * as types from './actionTypes';
import {FilterService} from './filter.service';
import * as Methods from './methods';
@Component({
  selector: 'filterDetail-component',
  templateUrl: "filterDetail.component.html",
  styleUrls: [ 'filter.scss' ]
})

export class FilterDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input() filterId: string;
  @Input() filter: {};
  @Input() columns: Array<any>;
  @Input() methods: Array<any>;
  @Input() lookupName: string;
  @Input() savedFilters: Array<any>;
  @Output() stateOutput = new EventEmitter<any>();
  @ViewChild('startPicker') startPicker: ElementRef;
  @ViewChild('endPicker') endPicker: ElementRef;

  documentId: string;
  data: any = {};
  length: number;
  filterMethods = [];
  subscriptions: Subscription[] = [];
  public filterDetail: any;

  constructor(private _service: NotificationsService, private filterService: FilterService){

  }

  ngOnInit() {
    this.filterDetail = new UserFilter();
    this.filterDetail.lookupName = this.lookupName;

    this.filterMethods = [
      {
        name: "Contains One of",
        prop: '$or'
      },
      {
        name: 'Equal to',
        prop: '$eq'
      },
      {
        name: 'Contains',
        prop: '$regex'
      },
      {
        name: 'Start With',
        prop: 'like%'
      },
      {
        name: 'Like',
        prop: '%like%'
      },
      {
        name: 'Between',
        prop: '<>'
      },
      {
        name: 'Greater',
        prop: '$gte'
      },
      {
        name: 'Less',
        prop: '$lt'
      },
      {
        name: 'Not Equal',
        prop: '$ne'
      }
    ];
  }

  ngOnChanges(changes) {
    this.filterDetail = this.filter;
  }

  onFilterChange(filter: any) {
    this.filterDetail = filter;
    let length = this.filterDetail.conditions.length;

    if(length > 0) {
      this.filterDetail.conditions.forEach((condition) => {
        condition.methods = Methods[condition.type];
      })
    }
  }

  removeAddedFilter(filter) {
    if (filter._id == this.filterDetail['_id']) {
      this.filterDetail = new UserFilter();
      return true;
    } else {
      return false;
    }
  }

  addValueToCondition(selectedCondition, conditionIndex, tag) {
    if (tag) {
      if(selectedCondition.method === '$or') {

        let isExist = this.filterDetail.conditions[conditionIndex].value.some(value => value === tag);
        if (!isExist) {
          this.filterDetail.conditions[conditionIndex].value.push(tag);
        }
      }
    }

  }

  removeTag(selctedCondition, conditionIndex, index) {
    // let conditionIndex = this.userFilter.conditions.findIndex((condition) => {
    //   return condition.method === selctedCondition.method;
    // });

    if (selctedCondition.method === '$or') {
      this.filterDetail.conditions[conditionIndex].value.splice(index, 1);
    }
  }

  removeCondition(selctedCondition, conditionIndex) {
    // let conditionIndex = this.userFilter.conditions.findIndex((condition) => {
    //   return condition.method === selctedCondition.method;
    // });
    this.filterDetail.conditions.splice(conditionIndex, 1);
  }

  saveFilter() {
    if (this.filterDetail.name) {
      this.filterDetail.lookupName = this.lookupName;
      this.filterDetail['parentTenantId'] = Session.get('parentTenantId');

      if ('_id' in this.filterDetail) {
        let index = this.savedFilters.findIndex(filter => this.filterDetail['_id'] === filter._id);
        if (index >= 0) {
          let sub = MeteorObservable.call('replaceOne', 'userFilters', {_id: this.filterDetail['_id']}, this.filterDetail, {}).subscribe((res) => {
            this.savedFilters[index] = this.filterDetail;
            this.applyFilter();
          });
          this.subscriptions.push(sub);
        } else {
          delete this.filterDetail['_id'];
          this.saveNewFilter();
        }
      } else {
        this.saveNewFilter();
      }
      this.stateOutput.emit({
        type: types.SAVE_FILTER,
        value: {
          filter: this.filterDetail
        }
      });
    } else {
      this._service.alert(
        'Failed',
        'Filter name is required',
        {}
      )
    }
  }

  saveNewFilter() {
    if (this.filterDetail.conditions[0].value == '') {
      this._service.alert(
        'Warning',
        'Please add a condition'
      );
      return;
    }
    let sub = MeteorObservable.call('insert', 'userFilters', this.filterDetail).subscribe((res:any) => {
      if ('error' in res) {
        if (res['error'].code == 11000) {
          this._service.error(
            'Failed',
            'Duplicate document'
          );
        }
      } else {
        this.filterDetail['_id'] = res.result;
        this.applyFilter();
        let result = {
          type: types.SAVE_NEW_FILTER,
          value: {
            filter: this.filterDetail
          }
        };

        this.stateOutput.emit(result);

      }
    });
    this.subscriptions.push(sub);
  }

  hideFilterDetail() {
    this.stateOutput.emit({
      type: types.HIDE_FILTER_DETAIL_COMPONENT
    })
  }

  addCondition() {

    this.filterDetail.conditions.push({
      column: '',
      type: '',
      method: '',
      value: ''
    });
  }

  applyFilter() {
    if (!('value' in this.filterDetail.conditions[0]) ||
      this.filterDetail.conditions[0].value == '' ||
      this.filterDetail.conditions.length <= 0) {
      this._service.alert(
        'Warning',
        'Please add a condition'
      );
      return;
    }

    if (!this.filterDetail.name) {
      this.filterDetail.name = "DEFAULT";
    }
    let queryParams:any = {};
    this.filterDetail.conditions.forEach(condition => {
      let query = condition.column + '.' + condition.method;
      queryParams[query] = condition.value;
    });
    // this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
    let result = {
      type: types.APPLY_FILTER,
      value: {
        filter: this.filterDetail
      }
    };
    this.stateOutput.emit(result);
  }

  deleteFilter() {
    let filterAction = {
      type: types.DELETE_FILTER,
      value: {
        filter: this.filterDetail
      }
    };
    this.stateOutput.emit(filterAction);
  }

  onMethodChange(event, conditionIndex) {
    let condition = this.filterDetail.conditions[conditionIndex];

    switch(condition.method) {
      case '$gte':
        condition.value = [];
        return;
      case '$or': case '$lt':
        condition.value = [];
        return;
      case '<>':
        condition.value = [];
        return;
      case '$eq': case '$ne':
        if (condition.type == 'date') {
          condition.value = null;
        } else {
          condition.value = '';
        }

        return;
      default:
        condition.value = [];
        return;
    }
  }

  onColumnChange(event, conditionIndex) {
    let condition = this.filterDetail.conditions[conditionIndex];
    this.columns.findIndex(column => {
      if (condition.column == column.prop) {
        condition.type = column.type;
        return true;
      }
    });
    condition.methods = Methods[condition.type];

    switch(condition.method) {
      case '$or':
        condition.value = [];
        return;
      case '<>':
        condition.value = [];
        return;
      case '$eq':
        condition.value = '';
        return;
      default:
        condition.value = '';
        return;
    }
  }

  reducers(action) {
    switch(action.type) {
      case types.SAVE_NEW_FILTER:

        return;
      case types.UPDATE_FILTER:
        return;
      default:
        return;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      // subscription.unsubscribe();
    })
  }

}