import {Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {subscribeOn} from "rxjs/operator/subscribeOn";
import { ReactiveVar } from 'meteor/reactive-var';

@Injectable()
export class UserService {

  static groups = [];
  static user:any;
  constructor() {
    if (Meteor.userId()) {
      MeteorObservable.call('getCurrentUserGroups', Session.get('tenantId')).subscribe((res:any) => {
        UserService.groups = res;
      });
      MeteorObservable.call('getCurrentUser').subscribe(res => {
        UserService.user = res;
      });
    }

  }
}