import { Component } from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'customers-quote',
  templateUrl: 'customers-quotes.page.html',
  styleUrls: ['customers-quotes.page.scss'],
})

export class CustomersQuotesPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (!('filters' in params)) {
        this.router.navigate([], { queryParams: { 'filters': 'TWtGhx5PboG7cyrXf', 'status': '$eq.pending' }, queryParamsHandling: 'merge' });
      }
    });
    this.documentId = Meteor.userId();
  }
  
  returnToOldApp(action) {
    window.location.href = 'https://app.yibas.com/createQuote';
  }

  select(event){
    this.router.navigate(['customers/quotes/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/customerQuote/' + event._id;
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
