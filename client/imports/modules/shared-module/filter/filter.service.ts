import {Injectable} from '@angular/core';
import { ReactiveVar } from 'meteor/reactive-var';

@Injectable()
export class FilterService {

  state: any = {
    isDetailHidden: true,
    addedFilters: [],
    selectedFilter: {},
    savedFilters: {},
    columns: []
  };

  constructor() {
  }

  setState(obj:Object) {
    Object.keys(obj).forEach(key => {
      this.state[key].set(obj[key]);
    })
  }
}
