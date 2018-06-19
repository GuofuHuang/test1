import { Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, FormControl} from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { NotificationsService } from 'angular2-notifications';
import {MatDialog} from '@angular/material';

import { Users } from '../../../../both/collections/users.collection';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';

import { Router } from '@angular/router';

@Component({
  selector: 'admin-users',
  templateUrl: 'admin-users.page.html'
})

export class AdminUsersPage implements OnInit{

  filterConditions: any;
  userCollections: any[];
  userLookupName: string;
  newUser: FormGroup;
  email: string;
  readonly: boolean = true;

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  password: string;
  tenants: any = [];

  constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}

  ngOnInit() {
    this.newUser = new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      email: new FormControl(''),
      password: new FormControl('')
    });

    this.userCollections = [Users];
    this.userLookupName = 'users';
    let selector = {
      $or: [
        {
          _id: Session.get('parentTenantId'),
        },
        {
          parentTenantId: Session.get('parentTenantId')
        }
      ]
    };
    let args = [selector];

  }

  openDialog() {
    if (this.hideTable === false) {
      let dialogRef = this.dialog.open(FilterDialogComponent);
      dialogRef.afterClosed().subscribe(event => {
        if (event) {
          let result = true;
          if (event === true) {
            result = false;
          }
          this.data = {
            value : event,
            hidden: result
          }
        }
      });
    }
    this.hideAddForm = true
    this.hideTable = false
  }

  addButton(event) {
    this.hideAddForm = false
    this.hideTable = true
  }

  onSelect(event) {
    this.router.navigate(['/admin/users/' + event._id]);
  }

  addUser(user) {
    let tenants = this.tenants.map(tenant => {
      let temp = {
        _id: tenant._id,
        enabled: false,
        groups: [""]
      };
      return temp;
    });

    if (user.valid) {
      let newUser = {
        username: user.value.email,
        email: user.value.email,
        profile: {
          firstName: user.value.firstName,
          lastName: user.value.lastName
        },
        password: user.value.password,
        parentTenantId: Session.get('parentTenantId')
      }

      MeteorObservable.call('addUser', newUser).subscribe((res:any) => {
        this._service[res.result](
          res.subject,
          res.message
        )
        if (res.result === 'success') {
          this.router.navigate(['/admin/users', res.userId]);
        }
      });
    }
  }

  removeReadonly() {
    this.readonly = false;
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
