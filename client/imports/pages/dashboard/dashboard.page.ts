import {Component, ViewChild, OnInit, OnDestroy, HostListener, ElementRef} from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { MatSidenavModule } from '@angular/material';

import 'rxjs/add/operator/filter';

import * as funcs from "../../../../both/functions/common";
import {PageResolver} from "../../resolvers/PageResolver";
import {NotificationsService} from "angular2-notifications";
import {EventEmitterService} from "../../services";
import {GlobalVariablesService} from "../../services/GlobalVariables.service";

@Component({
  selector: 'dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: [ 'dashboard.page.scss' ],
})

export class DashboardPage implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenavModule;

  sub: Subscription;
  isInMaintenance:any = '';
  tenants: any;
  isTestWebsite: boolean = Meteor.settings.public.isTestWebsite;
  selectedCompany: any;
  label: string;
  isCompanyReady: boolean = false;
  placeholder: string = 'Select Your Company';
  pathname: string;
  isDim = false;
  text = '';

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

  breadcrumbs: Array<Object> = [];
  showFabButton: boolean = true;
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  mobile: boolean = false;

  constructor(private _router: Router, private route:ActivatedRoute, private _service: NotificationsService,
              private eRef: ElementRef) {
    this.mobile = funcs.checkMobile();
  }

  @HostListener('document:wheel', ['$event'])
  handleWheelEvent(event) {
    if (GlobalVariablesService.scrolling == false) {
      event.preventDefault();
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event) {
    if (GlobalVariablesService.scrolling == false) {
      event.preventDefault();
    }
  }


  test(){
    if (this.mobile) {
      (this.sidenav as any).close();
    }
  }

  hookEvents() {
    this.sub = EventEmitterService.Events.subscribe(res => {
      if (res.componentName == 'dashboard') {
        if (res.type == 'success') {
          this._service.success(
            res.title,
            res.content
          )
        } else if (res.type == 'error') {
          this._service.error(
            res.title,
            res.content
          )
        }
      }
    })
  }

  async ngOnInit() {

    console.log('dashboard runs');
    let systemConfig:any = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemOptions', {name: 'systemConfig'}));

    if(systemConfig) {
      this.isInMaintenance = systemConfig.value.isInMaintenance;
      let isDeveloper = PageResolver.isDeveloper;
      if (isDeveloper === true) {
        this.isInMaintenance = false;
      }
    } else {
      this.isInMaintenance = false;
    }

    // setTimeout(() => {
    //   this._service.success('test11', 'test');
    //   this._service.success('test11', 'test');
    // }, 3000);
    // UserStatus.startMonitor({
    //   threshold: 60000,
    //   interval: 3000
    // });

    // this.setLandTime();
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     if (this.pathname != window.location.pathname) {
    //       // this.setLandTime();
    //     }
    //   }
    // });
    this.hookEvents();
    let subdomain = window.location.host.split('.')[0];

    if (Meteor.userId()) {
      let parentTenantId = Session.get('parentTenantId');
      if (parentTenantId) {
        const currentUser:any = await funcs.getUser(Meteor.userId());
        if ('tenants' in currentUser) {
          const tenantIds = currentUser.tenants.map(tenant => tenant._id);
          let query = {
            _id: {
              $in: tenantIds
            }
          };
          this.tenants = await funcs.find('systemTenants', query, {});
          this.isCompanyReady = true;
          this.placeholder = '';
          this.tenants.some((item, index) => {
            if (item.subdomain == subdomain) {
              this.selectedCompany = this.tenants[index];
              return true;
            }
          })
        }
      }
    }
  }

  toggleFab(e) {
    setTimeout(() => {
      GlobalVariablesService.scrolling = e;
      this.isDim = !e;
    }, 0);
  }

  onSelect(event) {
    Session.set('tenantId', event._id);
  }

  setLandTime() {
    this.pathname = window.location.pathname;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
