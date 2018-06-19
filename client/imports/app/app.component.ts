import { Component, HostBinding, OnInit } from '@angular/core';
import {EventEmitterService} from "../services";
import {OverlayContainer} from "@angular/cdk/overlay";
import {Session} from "meteor/session";
import {MeteorObservable} from "meteor-rxjs";
import * as moment from 'moment';
import {PageResolver} from "../resolvers/PageResolver";
import * as funcs from '../../../both/functions/common';
import {Random} from "meteor/random";
import {NavigationEnd, Router} from '@angular/router';
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'app',
  templateUrl: 'app.html'
})

export class AppComponent {
  @HostBinding('class') componentCssClass;
  pathname = window.location.pathname;

  constructor(
    private _router: Router,
    public overlayContainer: OverlayContainer) {
  }

  async ngOnInit() {
    this.setTheme({value: 'default-theme'});
    this.hookEvents();

    // let sub = MeteorObservable.subscribe('currentUser');
    // let autorun = MeteorObservable.autorun();
    //
    // Observable.merge(sub, autorun).subscribe(() => {
    //   let currentUser:any = Meteor.users.findOne(Meteor.userId());
    //   if (currentUser && 'status' in currentUser) {
    //
    //     // if (currentUser.status.idle) {
    //     //   MeteorObservable.call('update', 'users', {_id: currentUser._id}, {$set: {"status.editable": false, "status.page": window.location.pathname}})
    //     //     .subscribe(() => {
    //     //       MeteorObservable.call('users.setEditable', window.location.pathname).subscribe();
    //     //     });
    //     // } else {
    //     //   MeteorObservable.call('users.setEditable', window.location.pathname).subscribe();
    //     // }
    //   }
    // });

    // let subdomain = window.location.host.split('.')[0];
    // Session.set('subdomain', subdomain);
    // if (Meteor.userId()) {
    //   let tenant;
    //   let query = {
    //     subdomain
    //   };
    //   console.log('before');
    //   let func = MeteorObservable.call('findOne', 'systemTenants', query, {});
    //   let res:any = await funcs.callbackToPromise(func);
    //   console.log('res', res);
    //   if (res) {
    //     console.log('tenant', res);
    //     Session.set('maxLoanValue', res.maxLoanAmount);
    //     Session.set('endContractDate', res.endContractDate);
    //     Session.set('parentTenantId', res._id);
    //     Session.set('tenantId', res._id);
    //     let query = {
    //       sessionId: localStorage.getItem('sessionId')
    //     };
    //     let options = {fields: {sessionId: 1, createdUserId: 1, createdAt: 1}};
    //
    //     let systemLog:any = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', query, options));
    //
    //     if (systemLog) {
    //       // let date = systemLog.createdAt;
    //       // let convertDate =  moment(new Date(date)).format('DD MMM YYYY');
    //       // let currentDate =  moment(new Date()).format('DD MMM YYYY');
    //       // let isEqual = false;
    //       //
    //       // if (convertDate === currentDate) {
    //       //   // don't do anything
    //       //   isEqual = true;
    //       // } else {
    //       //   // generate new sessionId and insert
    //       //   isEqual = false;
    //       // }
    //       //
    //       // if (systemLog && isEqual) {
    //       //   PageResolver.systemLog = systemLog;
    //       // } else {
    //       //   let newSessionId = funcs.uuidv4();
    //       //   localStorage.setItem('sessionId', newSessionId);
    //       //
    //       //   let systemLog = {
    //       //     sessionId: newSessionId,
    //       //     createdAt: new Date(),
    //       //     createdUserId: Meteor.userId(),
    //       //     parentTenantId: Session.get('parentTenantId'),
    //       //     actions: []
    //       //   };
    //       //
    //       //   let res:any = await funcs.callbackToPromise(MeteorObservable.call('insert', 'systemLogs', systemLog));
    //       //
    //       //   localStorage.setItem('systemLogId', res.result);
    //       //   query = {
    //       //     sessionId: newSessionId
    //       //   };
    //       //   PageResolver.systemLog = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', query, options));
    //       // }
    //     } else {
    //
    //     }
    //   }
    // }
    this.onRouterChange();

    // console.log('last app component');
  }

  hookEvents() {
    EventEmitterService.Events.subscribe((event:any) => {
      if (event.name == 'setTheme') {
        this.setTheme(event);
      }
    })
  }

  setTheme(theme) {
    this.overlayContainer.getContainerElement().classList.add(theme.value);
    this.componentCssClass = theme.value;
  }

  onRouterChange() {
    this._router.events.subscribe(events => {
      if (events instanceof NavigationEnd) {
        if (this.pathname != window.location.pathname) {
          // real change
          let log = {
            log: 'Lands on ' + window.location.pathname,
            collectionName: 'URL Change',
            document: window.location.pathname,
            date: new Date(),
            _id: Random.id()
          };

          funcs.log(PageResolver.systemLog._id, log);
          this.pathname = window.location.pathname;
        }
      }
    });
  }
}
