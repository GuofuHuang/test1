import {Component, Input, OnInit, OnDestroy, EventEmitter, Output, ViewChild, ElementRef} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router, Params, NavigationEnd} from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import {PageResolver} from "../../../resolvers/PageResolver";
import {EventEmitterService} from "../../../services";

@Component({
  selector: 'fabButton',
  templateUrl: 'fabButton.component.html',
  styleUrls: [ 'fabButton.component.scss' ]
})

export class FabButtonComponent implements OnInit, OnDestroy {
  @Input() fabButton: any;
  @Input() data: any;
  @Output() emitter: any = new EventEmitter <any>();

  @ViewChild('menu') menu: ElementRef;

  isClosed = true;
  count = 0;
  sub: Subscription;
  systemLookup: any;
  label: string;
  buttonIcon: string;
  buttons: Array<any> = [];
  resolveData = this._route.snapshot.data;

  constructor(public dialog: MatDialog, private _router: Router, private _route: ActivatedRoute) {}

  ngOnInit() {
    this.getButtons();
  }

  getButtons() {
    this.onAbsoluteUrlChange();
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.onAbsoluteUrlChange();
      }
    });
  }

  onAbsoluteUrlChange() {
    let pageRoute = PageResolver.getCurrentPageRoute();
    if ('data' in pageRoute) {
      if ('buttonIcon' in pageRoute.data) {
        this.buttonIcon = pageRoute.data.buttonIcon;
      }
      if ('buttons' in pageRoute.data) {
        this.buttons = pageRoute.data.buttons.filter(button => this.resolveData.groupsPermissions[button.permissionId] == 'enabled');
      }
    } else {
      this.buttons = [];
      this.buttonIcon = '';
    }
  }

  onClick(button){
    const url = button.url;
    if ('url' in button) {
      if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
        window.location.href = url;
      } else {
        let arr = url.split('?');
        let absolutePath = arr[0];
        let obj:any = {};
        if (arr.length > 1) {
          let paramStr = arr[1];
          let paramsArr = paramStr.split('&');
          paramsArr.forEach(paramStr => {
            let key = paramStr.split('=')[0];
            obj[key] = paramStr.split('=')[1];
          })
        }
        this._router.navigate([absolutePath], {queryParams: obj, queryParamsHandling: 'merge'});
      }
    } else {
      if ('eventName' in button) {
        EventEmitterService.Events.emit(button.eventName);
      }
    }
  }

  closed(e) {
    if (this.count == 1) {
      if (this.menu['_panelAnimationState'] == 'void') {
        this.emitter.emit(false);
      } else {
        this.emitter.emit(true);
      }
      if (this.buttons.length == 0) {
        this.emitter.emit(true);
      }
      this.count = 0;
    } else {
      this.count++;
    }
  }

  open(e) {

  }

  ngOnDestroy() {
    // this.sub.unsubscribe();
  }
}
