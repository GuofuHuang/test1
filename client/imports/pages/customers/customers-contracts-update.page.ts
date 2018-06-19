import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, OnChanges} from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";

import * as funcs from "../../../../both/functions/common";
import {CustomersService} from './customers.service';
import {NotificationsService} from "angular2-notifications";

@Component({
  selector: 'customers-contracts-update',
  styleUrls: ["customers.scss"],
  template: `
    <page-header [(pageHeaderInput)]="pageHeader"></page-header>
    
    <mat-card>
      <div fxLayout="row" fxLayout.xs="column" fxLayoutAlign="space-between center" fxLayoutAlign.xs="space-between stretch"
           class="ph-24 selectorForm">
        <div fxFlex="50" fxFlex.xs="100" class="select-containter" (click)="showView('selectUpdatedCustomer')">
          <label>SELECT CUSTOMER</label>
          <mat-input-container class="full-width">
            <input matInput [(placeholder)]="placeholder" readonly aria-readonly [(ngModel)]="toCustomerLabel">
          </mat-input-container>
        </div>
        <div fxFlex="50" fxFlex.xs="100" style="padding-left: 20px">
          <mat-slide-toggle           
              [(checked)]="isSlideChecked"
              color="primary"
              (change)="onSlideChange($event)"
          >Select All Customers</mat-slide-toggle>
        </div>
      </div>
      <div class="ph-24">
        <mat-chip-list *ngIf="updatedCustomers.length > 0">
          <mat-chip *ngFor="let customer of updatedCustomers"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>{{customer.customer}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="">
              <mat-form-field fxFlex="auto" class="filter-remove" (click)="removeUpdatedCustomers(customer)">
                <mat-icon>clear</mat-icon>
              </mat-form-field>
            </div>
          </mat-chip>
        </mat-chip-list>

        <mat-chip-list *ngIf="excludedCustomers.length > 0">
          <mat-chip *ngFor="let customer of excludedCustomers"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>Except:{{customer.customer}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="">
              <div fxFlex="auto" class="filter-remove" (click)="removeExcludedCustomers(customer)">
                <mat-icon>clear</mat-icon>
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>
      </div>
      <div>
        <div style="width: 200px">
          <mat-input-container>
            <input matInput placeholder="Increase price by %" min="0" type="number" [(ngModel)]="increasePercentage">
          </mat-input-container>
        </div>
        <system-lookup [isModal]="true" #updateContractLookup [lookupName]="'checkProductsCategories'" [config]="config"></system-lookup>
      </div>

      <div class="m-10" *ngIf="isUpdateButtonShown">
        <button mat-raised-button color="primary" (click)="update()">Update</button>
      </div>

      <div *ngIf="isSpinShown">
        <mat-progress-bar mode="determinate" [value]="progressPercentage"></mat-progress-bar>
        Please Wait......
      </div>
    </mat-card>
  `,
})

export class CustomersContractsUpdatePage implements OnInit, OnDestroy {
  @ViewChild('updateContractLookup') updateContractLookup;

  @Input() props:any;
  @Output() onClick = new EventEmitter<any>();

  toCustomerLabel = '';
  // properties
  private _progressPercentage = 0;
  get progressPercentage() {
    return this._progressPercentage;
  }
  set progressPercentage(value) {
    this._progressPercentage = value;
    this._state.progressPercentage = value;
  }
  private _isSpinShown:boolean = false;
  get isSpinShown() {
    return this._isSpinShown;
  }
  set isSpinShown(value) {
    this._isSpinShown = value;
    this._state.increasePercentage = value;
  }

  private _isUpdateButtonShown:boolean = false;
  get isUpdateButtonShown() {
    return this._isUpdateButtonShown;
  }
  set isUpdateButtonShown(value) {
    this._isUpdateButtonShown = value;
    this._state.increasePercentage = value;
  }

  private _increasePercentage:number = CustomersService.increasePercentage;
  get increasePercentage() {
    return this._increasePercentage;
  }
  set increasePercentage(number:number) {
    this._increasePercentage = number;
    this._state.increasePercentage = number;
    CustomersService.increasePercentage = number;
  }

  private _updatedCustomers:Array<Object> = [];
  get updatedCustomers() {
    return this._updatedCustomers;
  }

  set updatedCustomers(customers:Array<Object>) {
    this._updatedCustomers = customers;
    this._state.updatedCustomers = customers;
    CustomersService.selectedCustomers = customers;
    this.updatedCustomerIds = customers.map((customer:any) => customer._id);
  }

  private _updatedCustomerIds:Array<string> = [];
  get updatedCustomerIds() {
    return this._updatedCustomerIds;
  }
  set updatedCustomerIds(ids:Array<string>) {
    this._updatedCustomerIds = ids;
    this._state.updatedCustomerIds = ids;
    if (ids.length > 0 ) {
      this.isUpdateButtonShown = true;
    }
  }

  private _excludedCustomers:Array<Object> = [];
  get excludedCustomers() {
    return this._excludedCustomers;
  }
  set excludedCustomers(customers:Array<Object>) {
    this._excludedCustomers = customers;
    this._state.excludedCustomers = customers;
    CustomersService.selectedCustomers = customers;
    this.excludedCustomersIds = customers.map((customer:any) => customer._id);
  }

  private _excludedCustomersIds = [];
  get excludedCustomersIds() {
    return this._excludedCustomersIds;
  }
  set excludedCustomersIds(ids:Array<string>) {
    this._excludedCustomersIds = ids;
    this._state.excludedCustomersIds = ids;
    if (ids.length > 0 ) {
      this.isUpdateButtonShown = true;
    }
  }

  private _isSlideChecked:boolean = CustomersService.isSlideChecked;
  get isSlideChecked() {
    return this._isSlideChecked;
  }
  set isSlideChecked(checked: boolean) {
    this._isSlideChecked = checked;
    this._state.isSlideChecked = checked;
    CustomersService.isSlideChecked = checked;

    if (checked) {
      this.isUpdateButtonShown = checked;
      this.placeholder = 'Exclude a Customer';
    } else {
      this.placeholder = 'Select a Customer to Update';
    }
  }

  private _state:any = {};

  get state() {
    return this._state;
  }

  config = {
    enableMultipleUsersUpdate: true
  };

  placeholder = 'Select a Customer to Update';
  pageHeader: string = 'Update Customer Contracts';





  constructor(private _service: NotificationsService) {}

  ngOnInit() {
    this.checkUpdatedCustomers(CustomersService.selectedCustomers);
  }

  showView(view) {
    this.onClick.emit(view);
  }

  async update() {
    this.isUpdateButtonShown = false;
    this.isSpinShown = true;

    let rows = this.updateContractLookup.returnDirtyRows();
    let checkboxFieldName = Object.keys(rows[0])[0];
    let copyRows = rows.filter(row => row[checkboxFieldName]);
    let categoryIds = copyRows.map(row => row._id);

    // get all product ids by selected categories
    let updatedProducts:any = await funcs.callbackToPromise(MeteorObservable.call('getCategoriesProducts', categoryIds));
    let updatedProductIds = updatedProducts.map(product => product._id);
    
    let updatedContractIds:any = [];
    if (this.isSlideChecked) {
      // get all contractIds
      updatedContractIds = await funcs.callbackToPromise(MeteorObservable.call('getAllContractIds', Session.get('tenantId')));

      if (this.excludedCustomersIds.length > 0) {
        const excludedContractIds:any = await funcs.callbackToPromise(MeteorObservable.call('getContractIdsByCustomerIds', this.excludedCustomersIds));
        updatedContractIds = updatedContractIds.filter(contractId => {
          if (excludedContractIds.includes(contractId)) {
            return false;
          } else {
            return true;
          }
        });
      }

    } else {
      updatedContractIds = await funcs.callbackToPromise(MeteorObservable.call('getContractIdsByCustomerIds', this.updatedCustomerIds));
    }

    if (this.increasePercentage != 0) {
      let length = updatedContractIds.length * 2;
      let count = 0;

      Promise.all(updatedContractIds.map((contractId:string) => {
        return new Promise(resolve => {
          funcs.getContractProductsById(contractId).then((contractProducts:any) => {
            updatedProductIds.forEach(productId => {
              let productIndex = contractProducts.findIndex(product => product._id == productId);
              if (productIndex > -1) {
                let product = contractProducts[productIndex];
                if (product.price != '' && product.price) {
                  product.previousPrice = product.price;
                }
                product.price *= (1 + this.increasePercentage/100);
                product.price = Number(product.price.toFixed(2));
                product.isSynced = false;
              }
            });
            count++;
            this.progressPercentage = count/length * 100;
            let update = {
              $set: {
                products: contractProducts
              }
            };

            funcs.update('customerContracts', {_id: contractId}, update).then(res => {
              count++;
              this.progressPercentage = count/length * 100;
              resolve(res);
            });
          })
        })
      })).then(res => {
        this.updatedCustomers = [];
        this.excludedCustomers = [];
        this.isSpinShown = false;
        this._service.success("Success", 'Update customers contract complete');
        this.updateContractLookup.reloadData('after update');
      })
    }
  }

  removeUpdatedCustomers(customer) {
    this.updatedCustomers = this.updatedCustomers.filter((_customer:any) => _customer._id != customer._id);
  }

  removeExcludedCustomers(customer) {
    this.excludedCustomers = this.excludedCustomers.filter((_customer:any) => _customer._id != customer._id);
  }

  onSlideChange(event) {
    this.isSlideChecked = event.checked;
    this.excludedCustomers = [];
    this.updatedCustomers = [];
  }

  checkUpdatedCustomers(customers) {
    if (this.isSlideChecked) {
      this.excludedCustomers = customers;
    } else {
      this.updatedCustomers = customers;
    }
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}
