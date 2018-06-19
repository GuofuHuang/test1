import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs/Subscription';

import { NotificationsService } from 'angular2-notifications';
import * as funcs from '../../../../../both/functions/common';

@Component({
  selector: 'login',
  templateUrl: "login.component.html",
  styleUrls: [ 'login.component.scss' ]
})


export class LoginComponent implements OnInit {
  email: string = '1212';
  password: string = '1212';
  loginForm: FormGroup;
  error: string;
  subscriptions: Subscription[] = [];
  isSigning: boolean = false;
  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    rtl: false,
    animate: 'scale',
    position: ['bottom', 'right']
  };

  constructor(private router: Router, private zone: NgZone, private formBuilder: FormBuilder, private _service: NotificationsService) {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {
    this.error = '';

    if (Meteor.userId()) {
      if (localStorage.getItem('sessionId')) {
        this.router.navigate(['/']);
      } else {
        Meteor.logout();
      }
    }
  }

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }


  login() {
    this.isSigning = true;
    if (this.loginForm && this.loginForm.valid) {
      Meteor.loginWithPassword(this.loginForm.value.email, this.loginForm.value.password, (err) => {
        this.zone.run(async () => {
          if (err) {
            this.isSigning = false;
            this.error = err;
            this._service.error('Failed', err.reason);
          } else {
            if (Meteor.userId()) {
              let sessionId = funcs.uuidv4();

              localStorage.setItem('sessionId', sessionId);
              let subdomain = window.location.host.split('.')[0];

              let query = {
                subdomain: subdomain
              };

              let tenant;

              tenant = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemTenants', query));

              Session.set('parentTenantId', tenant._id);
              Session.set('tenantId', tenant._id);

              let systemLog = {
                sessionId: sessionId,
                createdAt: new Date(),
                createdUserId: Meteor.userId(),
                parentTenantId: Session.get('parentTenantId'),
                actions: []
              };
              MeteorObservable.call('insert', 'systemLogs', systemLog).subscribe((res:any) => {
                localStorage.setItem('systemLogId', res.result);
                this.router.navigate(['/']);
              });
            }
          }
        })

      });
    }
  }
}