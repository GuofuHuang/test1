import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Users } from '../../../../both/collections/users.collection';
import { UserGroups } from '../../../../both/collections/userGroups.collection';
import { SystemTenants } from '../../../../both/collections/systemTenants.collection';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { MatDialog } from '@angular/material';

import 'rxjs/add/operator/map';
import {MeteorObservable} from "meteor-rxjs";
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';

@Component({
  selector: 'admin-user',
  templateUrl: 'admin-user.page.html',
  styleUrls: [ 'admin.scss' ]
})

export class AdminUserPage implements OnInit{

  @Input() data: any;
  @Output() onSelected = new EventEmitter<string>();

  changePassword = '';
  documentId: string;
  firstName: string;
  lastName: string;
  username: string;
  emailAddress: string;
  firstNameInput: string;
  lastNameInput: string;
  usernameInput: string;
  emailInput: string;
  fullName: string;
  user: any = {};

  fromCollection: any;
  updateCollection: any;
  lookupName: string;

  fromCollectionGroups: any;
  updateCollectionGroups: any;
  updatedDocumentIdGroups: string;

  fromCollectionTenants: any;
  updateCollectionTenants: any;
  updatedDocumentIdTenants: string;
  lookupNameTenants: string;

  dataObj: {};

  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog,  private _service: NotificationsService) {}

  ngOnInit() {

    this.route.params.subscribe((params: Params) => {
      this.documentId = params['documentId'];
    });

    this.fromCollection = Users;
    this.updateCollection = Users;
    this.documentId = this.documentId;
    this.lookupName = "manageUserTenants";

    this.fromCollectionGroups = UserGroups;
    this.updateCollectionGroups = Users;
    this.updatedDocumentIdGroups = this.documentId;
    // this.lookupNameGroups = "manageUserTenantGroups";


    this.fromCollectionTenants = SystemTenants;
    this.updateCollectionTenants = Users;
    this.updatedDocumentIdTenants = this.documentId;
    this.lookupNameTenants = "updateSystemTenants";


    MeteorObservable.call('returnUser', this.documentId).subscribe(userInfo => {

      if (userInfo !== undefined) {
        this.firstName = userInfo["profile"].firstName;
        this.lastName = userInfo["profile"].lastName;
        this.username = userInfo["username"];
        this.emailAddress = userInfo["emails"][0].address;

        this.fullName = this.firstName + " " + this.lastName
      }
    })
  }

  removeUser() {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let query = {
          _id: this.documentId
        };
        let update = {
          $set: {
            removed: true
          }
        };
        MeteorObservable.call('update', 'users', query, update).subscribe(res => {
          this._service.success(
            'Success',
            'Removed Successfully'
          );
          this.router.navigate(['/admin/users']);
        });

      }
    });
  }

  savePassword() {
    this._service.success(
      "Password Updated",
      'Successfully update the password',
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: true,
        clickToClose: false,
        maxLength: 10
      }
    );

    MeteorObservable.call('setPassword', this.documentId, this.user.newPassword).subscribe(res => {
    });
  }

  addTenant() {
    let dialogRef = this.dialog.open(DialogComponent);
    dialogRef.componentInstance['lookupName'] = 'addTenant';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let query = {
          _id: this.documentId
        }
        MeteorObservable.call('findOne', 'users', query, {}).subscribe((res:any) => {
          let tenants = res.tenants;
          let exist = false;
          tenants.some(tenant => {
            if (tenant._id === result._id) {
              exist = true;
              return true;
            }
          });
          if (exist) {
            this._service.error('Failed', 'already exist');
          } else {
            let update = {
              $addToSet: {
                tenants: {
                  _id: result._id,
                  enabled: true,
                  groups: [""]
                }
              }
            }

            MeteorObservable.call('update', 'users', query, update).subscribe(res => {
              this._service.success('Success', 'Update Successfully');
            })
          }
        })
      }
    });
  }

  onBlurMethod(target){
    let field = target.name;
    let value = target.value;
    let query = {
      _id: this.documentId
    }
    let update = {
      $set: {
        [field]: value
      }
    };
    MeteorObservable.call('update', 'users', query, update).subscribe(res => {})
  }
}