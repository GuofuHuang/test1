import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, NavigationEnd, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import * as funcs from "../../../both/functions/common";
import {MeteorObservable} from "meteor-rxjs";

@Injectable()
export class CanActivateTeam implements CanActivate {
  static userGroupsPermissions = {};
  static routes:any = [];
  constructor() {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean> {
    return new Promise(async(resolve) => {

      if (funcs.isEmptyObject(CanActivateTeam.userGroupsPermissions)) {
        CanActivateTeam.userGroupsPermissions = await funcs.callbackToPromise(MeteorObservable.call('getUserGroupsPermissions', Session.get('parentTenantId')));
      }
      if (CanActivateTeam.routes.length === 0) {

        CanActivateTeam.routes = await funcs.callbackToPromise(MeteorObservable.call('systemOptions.getPermissionIds', Session.get('parentTenantId')));
      }
      let permissionId = this._getPermissionId(_route);
      resolve(CanActivateTeam.userGroupsPermissions[permissionId] === 'enabled');
    })
  }

  _getPermissionId( _route) {
    let index = CanActivateTeam.routes.findIndex(route => {
      return route.url === _route.url[0].path;
    });
    if (index > -1) {
      return CanActivateTeam.routes[index].permissionId;
    } else {
      return ;
    }

  }
}