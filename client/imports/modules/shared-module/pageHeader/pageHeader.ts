import {Component, Input, OnInit, OnChanges, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: `page-header`,
  template: `
    <div class="sticky pageHeader">
      <h2>
        {{pageHeader}}
      </h2>
    </div>
  `,
  styles: [ 'pageHeader.scss' ]
})


export class PageHeader implements OnInit, OnChanges {
  @Input() pageHeaderInput: string;

  pageHeader: string;
  constructor(private _router: Router, private _route: ActivatedRoute) {
  }

  ngOnInit() {

    const moduelRoute:any = this._route.snapshot.data['pageData'];
    const suburl = window.location.pathname.split('/')[2];

    moduelRoute.routes.findIndex(route => {
      if (route.url == suburl) {
        if ('pageHeader' in route) {
          this.pageHeader = route.pageHeader;
        }
        return true;
      }
    });
    if (this.pageHeaderInput) {
      this.pageHeader = this.pageHeaderInput;
    }
    // this.getActiveUsers();
  }

  // getActiveUsers() {
  //   const sub = MeteorObservable.subscribe('userStatus', {"status.page": window.location.pathname, 'status.online': true});
  //   const autorun1 = MeteorObservable.autorun();
  //   Observable.merge(sub, autorun1).subscribe(async (res) => {
  //     this.activeUsers = Meteor.users.find({"status.page": window.location.pathname}, {sort: {"status.landTime": 1}}).fetch();
  //     console.log(this.activeUsers);
  //   });
  // }
  sticky() {
    // console.log('play');
  }


  ngOnChanges(changes) {
    this.pageHeader = changes.pageHeaderInput.currentValue;
  }
}