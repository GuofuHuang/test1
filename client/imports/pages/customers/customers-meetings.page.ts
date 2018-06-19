import { Router, Params, ActivatedRoute } from '@angular/router';
import {MeteorObservable} from "meteor-rxjs";
import { Component, OnInit, OnDestroy} from '@angular/core';
import { CalendarUtils } from 'angular-calendar';
import { MatDialog } from '@angular/material';
import {NotificationsService} from 'angular2-notifications';
import {
  WeekViewEventRow
} from 'calendar-utils';
import {startOfWeek, endOfWeek} from 'date-fns';
import * as isSameDay from 'date-fns/is_same_day';
import * as isSameMonth from 'date-fns/is_same_month';
import * as moment from 'moment';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { parseAll, generatePipeline, asyncGetLookupId } from '../../../../both/functions/common';

const colors: any = {
    cancelled: {
        primary: '#ff0000',
        secondary: '#FAE3E3'
    },
    pending: {
        primary: '#1e90ff',
        secondary: '#D1E8FF'
    },
    complete: {
        primary: '#26f267',
        secondary: '#bcffd1'
    }
};


@Component({
  selector: 'customer-meetings',
  templateUrl: 'customers-meetings.page.html',
  styleUrls: ['customers-meetings.page.scss'],
})

export class CustomersMeetingsPage implements OnInit, OnDestroy {
  public subscriptions: Subscription[] = [];
  isDataReady: boolean = false;
  documentId: string;
  data: any = {};
  filterConditions: any;

  Device = Meteor['Device'];

  end: string;
  start: string;

  selectedPerson: string;
  displayedPerson: string;

  eventRows: WeekViewEventRow[] = [];

  typeOfLookup: string = 'month';
  activeToggle: string = 'month';
  urlDateFormat: string = "MM.DD.YYYY";
  view: string = 'month';
  viewDate: Date = new Date();
  excludeDays: number[] = [0, 6];

  refresh: Subject<any> = new Subject();
  events: any[] = [
    // {
    //   title: 'TEST',
    //   start: setHours(setMinutes(new Date(), 0), 8),
    //   end: setHours(setMinutes(new Date(), 0), 10),
    //   color: colors.pending
    // }
  ];

  colorArr: any[] = [];
  objLocal: any = {};

  query: any[] = [];
  queryParams:any = {};

  viewAllMeetings: any[] = [];
  systemLookup: any = {};
  viewAll: boolean = false;

  activeDayIsOpen: boolean;
  email: string;
  hideList: boolean = true;

  constructor(private route: ActivatedRoute, private activatedRoute: ActivatedRoute, private dialog: MatDialog, private _service: NotificationsService, private router: Router, private utils: CalendarUtils,) {}


  async init() {
    let result;
    this.objLocal.data = {};
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.documentId = Meteor.userId();
    let sub = MeteorObservable.call('returnUser', Meteor.userId()).subscribe(user => {
      this.email = user["profile"].microsoftEmail;

      this.data.userIds = user["manages"];
      this.objLocal.data.userIds = user["manages"];
      this.data.userIds.push(this.objLocal.documentId);
      this.objLocal.data.userIds = this.data.userIds;
      if (this.data.userIds.length > 1) {
        this.viewAll = true;
      }
    });
    this.subscriptions.push(sub);
    sub = MeteorObservable.call('checkUserPermission', Meteor.userId(), 'accessAllMeetings').subscribe(permission => {
      if (permission['result'].length > 0) {
        if (permission['result'][0].status === 'enabled') {
          this.viewAll = true;
        }
      }
    });
    this.subscriptions.push(sub);
    sub = MeteorObservable.call('aggregate', 'users', [{ $project: { _id: 1, personalColor: "$profile.personalColor" } }]).subscribe(personalColors => {
      this.colorArr = personalColors['result']
    });
    this.subscriptions.push(sub);
    let id = await asyncGetLookupId('customerMeetings');

    sub = MeteorObservable.call('findOne', 'systemLookups', {_id: id}).subscribe(lookup => {
      this.systemLookup = lookup;
      this.typeOfLookup = lookup['methods'][0].type;
      this.activatedRoute.queryParams.subscribe((params: Params) => {
        this.isDataReady = false;
        let and = [];
        let parsed = parseAll(lookup['methods'][0].args, this.objLocal);
        let urlConditions = this.generateConditionsFromUrl(params);
        if (urlConditions.length !== 0) {
          urlConditions.forEach(condition => {
            if (!('value' in condition)) {
              condition['value'] = '';
            }
            generatePipeline(condition, and);
          });
        }
        if (this.typeOfLookup === 'find') {
          result = { $and: and };
        } else {
          result = { $match: { $and: and } };
        }
        this.query = parsed;
        if (and.length !== 0) {
          if (this.typeOfLookup === "find") {
            Object.assign(this.query[0], result);
          } else {
            this.query[0].push(result);
          }
        }
        this.query = (this.typeOfLookup === "find") ? this.query : this.query[0];
  
        if (params['view']) {
          if (params['view'] !== 'list') {
            this.view = params['view'];
            this.activeToggle = params['view'];
          } else {
            this.activeToggle = 'list';
            this.hideList = false;
          }
        }
        if (params['viewDate']) {
          this.viewDate = new Date(params['viewDate']);
        }
  
  
        if (params['view'] === 'week') {
          this.start = new Date(startOfWeek(this.viewDate)).toISOString();
          this.end = new Date(endOfWeek(this.viewDate)).toISOString();
        } else {
          this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString();
          this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString();
        }
        this.returnMeetings(this.systemLookup.methods[0].collectionName, this.query, this.start, this.end);
      });

    })
    this.subscriptions.push(sub);

  }

  ngOnInit() {
    this.init();
  }

  returnMeetings(collectionName, query, firstDay, lastDay) {
    let meetingArray = [];

    let sub = MeteorObservable.call('getUsersMeetings', collectionName, query, firstDay, lastDay).subscribe((meetings:Array<any>) => {
      if (meetings.length > 0) {
        meetings.map(meeting => {
          let name = meeting.customerName;
          let user = meeting.userName;
          let  initials = user.match(/\b\w/g) || [];
          initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
          // let personalColor = meeting.personalColor
          let personalColor;
          let userInfo = this.colorArr.find(o => o._id === meeting.userId);
          if (userInfo !== undefined) {
            personalColor = userInfo['personalColor'];
          }

          // let branch = meeting.branch 
          let branch = (meeting.branch === "") ? "NO BRANCH SELECTED" : meeting.branch;
          let dateTime = meeting.dateTime
          let endDateTime = meeting.endDateTime
          let status = meeting.status.toLowerCase()
          let color
          let meetingObj = {}
          let titleTime = moment(dateTime).format('h:mm A');
          let calendarViewDate = moment(dateTime).format('hh:mma');

          switch (status) {
            case "cancelled":
            color = colors.cancelled;
            break;
            case "pending":
            color = colors.pending;
            break;
            case "complete":
            color = colors.complete;
            break;
          }

          meetingObj = {
            title : titleTime + " - " + name + " - " + branch,
            dropDownTemplateTitle : titleTime + " - " + name + " - " + branch,
            start: new Date(dateTime),
            color: color,
            id: meeting._id,
            user: user,
            initials: initials,
            personalColor: personalColor,
            calendarViewBadge: calendarViewDate + " - " + name
          }

          if (endDateTime !== undefined) {
            meetingObj['end'] = new Date(endDateTime);
          }

          if (this.viewAll) {
            meetingObj['title'] = meetingObj['initials'] + ': ' + meetingObj['title'];
          }

          meetingArray.push(meetingObj)


        });
      }

      this.events = meetingArray;

      this.events.sort(function(a,b) {
        return a.start - b.start
      });
      this.isDataReady = true;
    })
    this.subscriptions.push(sub);
  }

  dayClicked({ date, events }: { date: Date; events: any[] }, event): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true && this.displayedPerson === this.selectedPerson) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
        this.displayedPerson = this.selectedPerson
      }
    }
  }

  testingBadges(day, dayEvents, event) {
    this.selectedPerson = event.key
  }

  handleEvent(action: string, event: any[]): void {
    this.router.navigate(['customers/meetings/' + event['id']]);
  }

  onSelect(selection) {
    this.view = selection;
    this.hideList = true;
    if (selection === 'week') {
      this.start = new Date(startOfWeek(this.viewDate)).toISOString()
      this.end = new Date(endOfWeek(this.viewDate)).toISOString()
    } else if (selection === 'month') {
      this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString()
      this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString()
    }
    this.activeDayIsOpen = false;
    this.returnMeetings(this.systemLookup.methods[0].collectionName, this.query, this.start, this.end);
    this.activeToggle = this.view;

    this.router.navigate([], { queryParams: { view: this.view }, queryParamsHandling: 'merge' });
  }

  list() {
    this.activeToggle = this.queryParams['view']
    this.router.navigate([], { queryParams: { view: 'list' }, queryParamsHandling: 'merge' });

    this.hideList = false;
  }

  arrowFunction() {
    this.activeDayIsOpen = false;
    if (this.view === 'month') {
      this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString()
      this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString()
    } else if (this.view === 'week') {
      this.start = new Date(startOfWeek(this.viewDate)).toISOString()
      this.end = new Date(endOfWeek(this.viewDate)).toISOString()
    }
    this.isDataReady = false
    this.returnMeetings(this.systemLookup.methods[0].collectionName, this.query, this.start, this.end);
    
    this.router.navigate([], { queryParams: { viewDate: this.viewDate}, queryParamsHandling: 'merge' });
  }



  returnToOldApp(action) {
    window.location.href = 'https://app.yibas.com/createQuote';
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch(action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

  generateConditionsFromUrl(params) {
    let conditions = [];
    Object.keys(params).forEach(key => {
      if (key != 'filters') {
      let arr = params[key].split('.');
        conditions.push({
          field: key,
          method: arr[0],
          value: arr[1],
        });
      }
    });
    return conditions;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      // subscription.unsubscribe();
    })
  }
}

