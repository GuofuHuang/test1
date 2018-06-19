import { Component } from '@angular/core';

@Component({
  selector: 'customer-inquiry',
  templateUrl: 'customers-inquiry.page.html'
})

export class CustomersInquiryPage {
  menus = [];
  subMenus = [];
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  constructor() {}

  onSelect(event) {
  }
}
