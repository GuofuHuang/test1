import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { Observable } from "rxjs/Observable";
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { AllCollections } from "../../../../../both/collections/index";
import { NotificationsService } from 'angular2-notifications';
import { Random } from 'meteor/random';
import { PageResolver } from "../../../resolvers/PageResolver";
import { EventEmitterService } from '../../../services/EventEmitter.service';

@Component({
  selector: 'executive-bankingBalance',
  template: `
    <mat-card class='fullHeight'>
      <h2>Banking Balance</h2>
      <hr>
      <div style="overflow-x:auto;">
        <table id='tables' *ngIf="!loading">
        <ng-template ngFor let-account [ngForOf]="bankingBalanceAccounts" let-i="index">
          <tr>
            <th class="rowHead">{{account.description}}</th>
            <td class='alignRight' *ngIf="editBalance">
              <mat-input-container>
              <span matPrefix>$</span>
              <input (keyup.enter)='rowEdit(account, $event)' type='tel' matInput style='text-align: right;' placeholder="Balance" value="{{account.latestYearFinalBalance | number:'2.2-2'}}">
                <button mat-button matSuffix mat-icon-button aria-label="Clear" (click)='verifyRow(account)'>
                  <mat-icon>check</mat-icon>
                </button>
              <mat-hint align="start" *ngIf='account.updatedInfo'>{{account.updatedInfo.user}} {{account.updatedInfo.date}}</mat-hint>
              </mat-input-container>
            </td>
            <td *ngIf="!editBalance">
              <span style="float: right">{{account.latestYearFinalBalance | currency:'USD':'symbol':'2.2-2'}}</span><br>
            </td>
          </tr>
          <tr *ngIf='account.updatedInfo && !editBalance' colspan="2"><td class='updatedAt' colspan='2'>Last Update: {{account.updatedInfo.user}} {{account.updatedInfo.date}}</td></tr>
        </ng-template>
        </table>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
      </div>
    </mat-card>
  `,
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveBankingBalancePage implements OnInit {

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  bankingBalanceAccounts = [];
  loading: boolean = true;
  editBalance: boolean = false;
  lastUpdatedAccountInfo: any;
  accountIdArr: any;
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private _service: NotificationsService) { }
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
  }

  ngOnInit() {
    this.init();

    MeteorObservable.call('checkUserPermission', Meteor.userId(), 'manageBankingBalance').subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.editBalance = true;
      }
    });
    
    const sub = MeteorObservable.subscribe('ledgerAccounts', { displayOnBankingBalanceCard: true });
    const autorun = MeteorObservable.autorun();
    
    Observable.merge(sub, autorun).subscribe(() => {
      this.accountIdArr = [];
      let result = AllCollections['ledgerAccounts'].collection.find().fetch();
      result.forEach((account) => {
        this.accountIdArr.push(account._id)
        if (account.override) {
          account.latestYearFinalBalance = account.override;
        } else {
          this.calculateBalance(account);
        }
      });
      if (this.accountIdArr.length > 0) {
        this.findLastUpdated(this.accountIdArr);
      }
      this.bankingBalanceAccounts = result;
      this.loading = false;
    })
  }

  calculateBalance(account) {
    const latestYearBalance = account.totals[account.totals.length - 1];
    const totalCreditAmounts = latestYearBalance.creditAmounts.reduce((a, b) => a + b);
    const totalDebitAmounts = latestYearBalance.debitAmounts.reduce((a, b) => a + b);
    account.latestYearFinalBalance = latestYearBalance.beginningBalance + totalCreditAmounts - totalDebitAmounts;
  }

  verifyRow(account) {
    let ledgerAccountId = account._id;
    let query = {
      _id: ledgerAccountId
    }
    let update = {
      $set: {
        'override': account.latestYearFinalBalance
      }
    };
    MeteorObservable.call('update', 'ledgerAccounts', query, update).subscribe((res: any) => {
      EventEmitterService.Events.emit({
        componentName: "dashboard",
        type: 'success',
        title: 'Banking Balance Verified',
        content: account.description
      })
  
      let value = {
        _id: Random.id(),
        documentId: account._id,
        collectionName: 'ledgerAccounts',
        type: 'update',
        field: 'override',
        log: Meteor.userId() + ' verified balance for ' + account.description,
        value: account.latestYearFinalBalance,
        date: new Date(),
      }
      funcs.log(PageResolver.systemLog._id, value);
      this.findLastUpdated(this.accountIdArr)
    })
  }

  rowEdit(account, event) {
    let ledgerAccountId = account._id;
    let overrideValue = parseFloat(event.target.value).toFixed(2);
    if (parseFloat(overrideValue) !== NaN) {
      let query = {
        _id: ledgerAccountId
      }
      let update = {
        $set: {
          'override': parseFloat(overrideValue)
        }
      };
      MeteorObservable.call('update', 'ledgerAccounts', query, update).subscribe((res: any) => {
        if (res > 0) {
          EventEmitterService.Events.emit({
            componentName: "dashboard",
            type: 'success',
            title: 'Banking Balance Updated',
            content: account.description
          })

          let value = {
            _id: Random.id(),
            documentId: account._id,
            collectionName: 'ledgerAccounts',
            type: 'update',
            field: 'override',
            log: Meteor.userId() + ' updated balance for ' + account.description,
            value: parseFloat(overrideValue),
            previousValue: account.latestYearFinalBalance,
            date: new Date(),
          }
          funcs.log(PageResolver.systemLog._id, value);
        }
      })
    }
  }

  getFilterConditions(action) {
    this.reducers(action);
  }
  reducers(action) {
    switch (action.type) {
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

  findLastUpdated(idArr){
    let query = [
      {
        "$match": {
          "parentTenantId": Session.get('tenantId')
        }
      },
      {
        "$unwind": "$actions"
      },
      { $match: { 'actions.documentId': { $in: idArr } } },
      {
        "$lookup": {
          "from": "users",
          "localField": "createdUserId",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$project": {
          "user": {
            "$ifNull": [
              {
                "$concat": [
                  "$user.profile.firstName",
                  " ",
                  "$user.profile.lastName"
                ]
              },
              "$user.email"
            ]
          },
          "documentType": "$actions.collectionName",
          'type': "$actions.type",
          "documentId": "$actions.documentId",
          "date": "$actions.date",
        }
      },
      { $match: { documentType: 'ledgerAccounts', type: 'update' } },
      {
        "$group": {
          "_id": "$documentId",
          "date": {
            "$max": "$date"
          },
          'docs': {
            "$push": {
              "user": "$user",
              "date": "$date"
            }
          }
        }
      },
      {
        "$project": {
          "docs": {
            "$setDifference": [
              {
                "$map": {
                  "input": "$docs",
                  "as": "doc",
                  "in": {
                    "$cond": [
                      { "$eq": ["$date", "$$doc.date"] },
                      "$$doc",
                      false
                    ]
                  }
                }
              },
              [false]
            ]
          }
        }
      },
      { $unwind: '$docs' },
      {
        $project: {
          _id: 1,
          user: '$docs.user',
          date: '$docs.date'
        }
      }
    ]

    MeteorObservable.call('aggregate', 'systemLogs', query).subscribe(account => {
      this.lastUpdatedAccountInfo = account['result'];
      this.bankingBalanceAccounts.forEach(account => {
        account.updatedInfo = this.lastUpdatedAccountInfo.find(function (element) {
          return element._id === account._id;
        });
        if (account.updatedInfo) {
          account.updatedInfo.date = moment(account.updatedInfo.date).format('MM/DD/YYYY hh:mmA');
        }
      });
    })
  }

  getRows(rows) {
    // console.log(rows);
    this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }
}
