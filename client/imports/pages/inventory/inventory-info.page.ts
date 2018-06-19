import { Component, OnInit, Input } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'inventory-info',
  template: `
    <page-header></page-header>
  `,
})

export class InventoryInfoPage implements OnInit{

  @Input() data: any;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
  }
}
