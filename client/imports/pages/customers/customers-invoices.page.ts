import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'customers-invoice',
  templateUrl: 'customers-invoices.page.html',
  styleUrls: ['customers-invoices.page.scss'],
})

export class CustomersInvoicesPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (!('filters' in params)) {
        this.router.navigate([], { queryParams: { 'filters': 'Sid7bgFjYapMsMyZ8', 'status': '$eq.open' }, queryParamsHandling: 'merge' });
      }
    });
    this.documentId = Meteor.userId();
  }

  select(event){
    this.router.navigate(['customers/invoices/' + event['_id']]);
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
