import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import * as funcs from "../../../both/functions/common";
import {MeteorObservable} from "meteor-rxjs";
import {Session} from "meteor/session";
import {PageResolver} from "../resolvers/PageResolver";
import * as moment from 'moment';
@Injectable()
export class CanActivateDashboard implements CanActivate {
  static routes:any = [];
  constructor() {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean> {
    return new Promise(async(resolve) => {
      await this.resolve();
      resolve(true);
    })
  }



  async resolve() {
    let subdomain = window.location.host.split('.')[0];
    Session.set('subdomain', subdomain);
    if (Meteor.userId()) {
      let tenant;
      let query = {
        subdomain
      };
      let func = MeteorObservable.call('findOne', 'systemTenants', query, {});
      let res:any = await funcs.callbackToPromise(func);
      if (res) {
        Session.set('maxLoanValue', res.maxLoanAmount);
        Session.set('endContractDate', res.endContractDate);
        Session.set('parentTenantId', res._id);
        Session.set('tenantId', res._id);
        let query = {
          sessionId: localStorage.getItem('sessionId')
        };
        let options = {fields: {sessionId: 1, createdUserId: 1, createdAt: 1}};

        let systemLog:any = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', query, options));

        if (systemLog) {
          let date = systemLog.createdAt;
          let convertDate =  moment(new Date(date)).format('DD MMM YYYY');
          let currentDate =  moment(new Date()).format('DD MMM YYYY');
          let isEqual = false;

          if (convertDate === currentDate) {
            // don't do anything
            isEqual = true;
          } else {
            // generate new sessionId and insert
            isEqual = false;
          }

          if (systemLog && isEqual) {
            PageResolver.systemLog = systemLog;
          } else {
            let newSessionId = funcs.uuidv4();
            localStorage.setItem('sessionId', newSessionId);

            let systemLog = {
              sessionId: newSessionId,
              createdAt: new Date(),
              createdUserId: Meteor.userId(),
              parentTenantId: Session.get('parentTenantId'),
              actions: []
            };

            let res:any = await funcs.callbackToPromise(MeteorObservable.call('insert', 'systemLogs', systemLog));

            localStorage.setItem('systemLogId', res.result);
            query = {
              sessionId: newSessionId
            };
            PageResolver.systemLog = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', query, options));
          }
        }
      }
    }
  }
}