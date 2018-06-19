import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { MatDialog } from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { Subscription } from 'rxjs/Subscription';

import * as funcs from "../../../../both/functions/common";

@Component({
  selector: 'customers-contracts-copy',
  styleUrls: ["customers.scss"],
  template: `
    <page-header [(pageHeaderInput)]="pageHeader"></page-header>

    <!--<div class="subHeader">-->
      <!--<h2><mat-icon class="cursor-pointer" (click)="showView('')">chevron_left</mat-icon> Copy Customer Contract</h2>-->
    <!--</div>-->

    <mat-card>
      <div fxLayout="row" fxLayout.xs="column" fxLayoutAlign="space-between center" fxLayoutAlign.xs="space-between stretch"
           class="ph-24 selectorForm">
        <div fxFlex="100" fxFlex.xs="100" class="select-containter" (click)="showView('selectfromcustomer')">
          <label>FROM CUSTOMER</label>
          <mat-form-field class="full-width">
            <input matInput placeholder="Select From Customer" readonly aria-readonly [(ngModel)]="state.fromCustomerLabel">
          </mat-form-field>
        </div>
        <div fxFlex="4" fxFlex.xs="none">
        </div>
        <div fxFlex="100" fxFlex.xs="100" class="select-containter" (click)="showView('selecttocustomer')">
          <label>TO CUSTOMER</label>
          <mat-form-field class="full-width">
            <input matInput placeholder="Select To Customer" readonly aria-readonly [(ngModel)]="state.toCustomerLabel">
          </mat-form-field>
        </div>
      </div>
      <div class="ph-24">
        <mat-chip-list>
          <mat-chip *ngFor="let customer of state.toCustomersList"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>{{customer.customer}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="">
              <div fxFlex="auto" class="filter-remove" (click)="removeFromToCustomersList(customer)">
                <!--<mat-icon>clear</mat-icon>-->
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>
      </div>
      <div>
        <div style="width: 200px">
          <mat-input-container>
            <input matInput placeholder="Increase price by %" type="number" [(ngModel)]="state.increasePercentage">
          </mat-input-container>  
        </div>
        
        <div *ngIf="state.copyData.contractId">
          <system-lookup [isModal]="true" #copyContractLookup [lookupName]="'contractProductsCategories'" [config]="config" [(data)]="state.copyData"></system-lookup>
        </div>

      </div>

      <div class="m-10" *ngIf="state.toCustomersList.length > 0">
        <button mat-raised-button color="primary" (click)="copy()">Copy</button>
      </div>
    </mat-card>
  `,
})

export class CustomersContractsCopyPage implements OnInit, OnDestroy {
  @ViewChild('copyContractLookup') copyContractLookup;

  @Input() state:any = {
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
  @Output() onClick = new EventEmitter<any>();

  config = {
    enableMultipleUsersUpdate: true
  };

  constructor(
    public snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private _service: NotificationsService
  ) {}
  filterConditions: any;

  pageHeader: string = 'Copy Customer Contracts';
  documentId: string;
  subscription: Subscription;


  ngOnInit() {

  }

  showView(view) {
    this.onClick.emit(view);
  }

  removeFromToCustomersList(customer) {
    this.state.toCustomersList = this.state.toCustomersList.filter(_customer => {
      if (_customer._id != customer._id) {
        return true;
      }
    });
    if (customer._id == this.state.selectedToCustomer._id) {
      this.state.selectedToCustomer = {};
      this.state.toCustomerLabel = '';
    }
  }

  async copy() {
    let rows = this.copyContractLookup.returnDirtyRows();
    let checkboxFieldName = Object.keys(rows[0])[0];
    let copyRows = rows.filter(row => row[checkboxFieldName]);
    let categoryIds = copyRows.map(row => row._id);

    // find all products in this contract using product lines
    // update the price, and get all updated products array
    let updatedProducts:any = await funcs.getUpdatedContractProducts(
      this.state.copyData.contractId,
      categoryIds,
      1 + 0.01 * this.state.increasePercentage);

    // replace toCustomers' products with updated products
    await Promise.all(this.state.toCustomersList.map(async (customer) => {
      let contractId = await funcs.getContractIdByCustomerId(customer._id);
      let contractProducts:any = await funcs.getContractProductsById(contractId);

      updatedProducts.forEach(updatedProduct => {
        let index = contractProducts.findIndex(product => product._id == updatedProduct._id);
        if (index > -1) {
          // replace
          if (contractProducts[index].price) {
            contractProducts[index].previousPrice = contractProducts[index].price;
          }
          contractProducts[index].price = updatedProduct.newPrice;
        } else {
          // insert
          contractProducts.push({
            _id: updatedProduct._id,
            price: updatedProduct.newPrice,
            createdAt: new Date(),
            createdUserId: Meteor.userId(),
            isSynced: false
          })
        }
      });
      let update = {
        $set: {
          products: contractProducts
        }
      };
      await funcs.update('customerContracts', {_id: contractId}, update);
    }));

    this._service.success("Success", 'Copy customers contract complete');

    this.copyContractLookup.reloadData('after copy');
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}
