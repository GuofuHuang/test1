import {Observable} from "rxjs/Observable";
import { DataSource } from '@angular/cdk/collections';
import {Component} from "@angular/core";

export class DataTableSource extends DataSource<any> {
  /** Connect function called by the table to retrieve one stream containing the data to render. */
  constructor(private _database: any) {
    super();
  }

  connect() {
    const displayDataChanges = [
      this._database
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      return this._database.value;
    });
  }

  disconnect() {}
}