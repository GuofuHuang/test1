import { Injectable } from '@angular/core';

@Injectable()
export class CustomersService {
  static fromCustomer = {};
  static toCustomers = [];
  static isSlideChecked = false;
  static updatedCustomers = [];
  static excludedCustomers = [];
  static selectedCustomers = [];
  static increasePercentage = 0;
  getExecutiveItems() {
  }
}
