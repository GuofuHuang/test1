import {Component, OnInit} from '@angular/core';

@Component({
  selector: `admin-logs`,
  template: `
    <page-header></page-header>
    <section class="box">
      <div>
        <filterBox-component (filter)="getFilterConditions($event)" [lookupName]="'systemLogs'"></filterBox-component>
      </div>
      <div [hidden]="hideTable">
        <section id="customerQuoteForm" class="container">
          <system-lookup [lookupName]="'systemLogs'" (onSelected)="onSelect($event)" [(data)]="data" [(filterConditions)]="filterConditions"></system-lookup>
        </section>
      </div>

    </section>
  `
})

export class AdminLogsPage implements OnInit {
  filterConditions: any;
  email: string;
  hideTable: boolean = false;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  consturctor() { }

  ngOnInit() {

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
}