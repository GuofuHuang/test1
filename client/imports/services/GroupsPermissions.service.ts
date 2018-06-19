import {Injectable, OnDestroy} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {MeteorObservable} from "meteor-rxjs";

@Injectable()
export class GroupsPermissionsService implements Resolve<any>, OnDestroy {
  static groupsPermissions = [];
  constructor(private router: Router) {}

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<any>|Promise<any>|boolean {
    if (GroupsPermissionsService.groupsPermissions.length > 0) {
      return new Promise(resolve => {
        resolve(GroupsPermissionsService.groupsPermissions);
      })
    } else {
      return new Promise((resolve) => {
        MeteorObservable.call('getUserGroupsPermissions', Session.get('tenantId')).subscribe((res:any) => {
          GroupsPermissionsService.groupsPermissions = res;
          resolve(GroupsPermissionsService.groupsPermissions);
        });
      });
    }
  }

  ngOnDestroy() {

  }
}