import {MeteorObservable} from "meteor-rxjs";
import { HTTP } from 'meteor/http'
import { MatDialog, MatDialogRef } from '@angular/material';
import { Component, OnInit, ChangeDetectorRef, ViewChild} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {NotificationsService} from 'angular2-notifications';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {DatePickerDirective, IDayCalendarConfig} from 'ng2-date-picker';
import * as moment from 'moment';
import * as _ from "underscore";
import { NewCustomerMeeting } from '../../../../both/models/customerMeeting.model';
import * as funcs from '../../../../both/functions/common';
import * as SystemConfig from '../../../../both/config/systemConfig';
import { PageResolver } from "../../../../client/imports/resolvers/PageResolver";
import { Random } from 'meteor/random';

import {EventEmitterService} from "../../services";

@Component({
  selector: 'customers-meetings-form',
  templateUrl: 'customers-meetings-create.component.html',
  styleUrls: ['customers-meetings-create.component.scss']
})

export class CustomersMeetingsCreateComponent implements OnInit {
  @ViewChild("dateFromDp") public dateFromDp: DatePickerDirective;
  @ViewChild("dateToDp") public dateToDp: DatePickerDirective;

  options = SystemConfig.alertOptions;
  isDataReady: boolean = false;
  meetingId: string;
  notesObj: any = {};
  previousNotes: any = {};
  completeStatus = false;
  showCompleteButton: boolean = false;
  dateTimeConfig = <IDayCalendarConfig>{
    locale: moment.locale(),
    disableKeypress: true,
    drops: 'down',
    firstDayOfWeek: "su",
    format: "DD MMM YYYY hh:mm A",
    dayBtnFormat: "D",
    minutesInterval: 15,
  };
  endDateTimeConfig = <IDayCalendarConfig>{
    locale: moment.locale(),
    disableKeypress: true,
    drops: 'down',
    firstDayOfWeek: "su",
    format: "DD MMM YYYY hh:mm A",
    dayBtnFormat: "D",
    minutesInterval: 15,
  };
  view: string;
  email: string;
  userName: string;
  microsoftId: string;
  shipTo: string;
  customerMeeting: FormGroup;
  customerNameTitle: string;
  customerNumber: string;
  customerHasNoBranches: boolean = false;
  customerId: string;
  customerAddress: string;
  documentId: string;
  labelTabs: any = {
    sales: 'Sales',
    pricing: 'Pricing',
    customerService: 'Customer Service',
    coolAir: 'Cool Air',
    marketing: 'Marketing',
    turbo: 'Turbo 200',
    ditek: 'Ditek',
    ductTies: 'Duct Ties',
    hungRite: 'Hung-Rite'
  };
  statuses = [{
    value: 'Pending',
    viewValue: 'Pending'
  },
    {
      value: 'Cancelled',
      viewValue: 'Cancelled'
    },
    {
      value: 'Complete',
      viewValue: 'Complete'
    }
  ];
  pageHeaderInput:String = "Customer Meetings";

  constructor(private dialog: MatDialog, private route: ActivatedRoute,
              private _service: NotificationsService, private router: Router, private cdRef: ChangeDetectorRef,
              private _fb: FormBuilder,
              private _router: Router,) {}

  ngOnInit() {
    const newMeeting = new NewCustomerMeeting();

    this.customerMeeting = this._fb.group({
      description: ['', < any > Validators],
      dateTime: [newMeeting.dateTime, < any > Validators],
      endDateTime: [newMeeting.endDateTime, < any > Validators],
      branch: ['', < any > Validators],
      status: [newMeeting.status, < any > Validators],
      salesNotes: ['', < any > Validators],
      pricingNotes: ['', < any > Validators],
      customerServiceNotes: ['', < any > Validators],
      coolAirNotes: ['', < any > Validators],
      marketingNotes: ['', < any > Validators],
      turboNotes: ['', < any > Validators],
      ditekNotes: ['', < any > Validators],
      ductTiesNotes: ['', < any > Validators],
      hungRiteNotes: ['', < any > Validators],
      userName: ['', < any > Validators],
      customerName: ['', < any > Validators],
      userId: [newMeeting.userId, < any > Validators],
      customerId: ['', < any > Validators],
      microsoftId: ['', < any > Validators],
      branchShipTo: ['', < any > Validators],
    });

    this.route.params.subscribe((params: Params) => {
      this.meetingId = params['meetingId'];
      this.completeStatus = false;
      if (this.meetingId) {
        MeteorObservable.call('findOne', 'customerMeetings', {
          _id: this.meetingId
        }).subscribe(meeting => {
          this.documentId = meeting['customerId'];
          this.userName = meeting['userName'];
          let previousNotesValues = {
            customerService: meeting['customerServiceNotes'],
            ditek: meeting['ditekNotes'],
            hungRite: meeting['hungRiteNotes'],
            marketing: meeting['marketingNotes'],
            ductTies: meeting['ductTiesNotes'],
            pricing: meeting['pricingNotes'],
            coolAir: meeting['coolAirNotes'],
            sales: meeting['salesNotes'],
            turbo: meeting['turboNotes'],
          }
          for (let key in meeting) {
            if (key === "dateTime") {
              meeting[key] = moment(new Date(meeting[key])).format(this.dateTimeConfig.format);
              this.endDateTimeConfig['min'] = meeting[key];
            }
            if (key === "endDateTime") {
              meeting[key] = (meeting['endDateTime'] !== undefined) ? moment(new Date(meeting[key])).format(this.dateTimeConfig.format) : moment(new Date(meeting[key])).add(1, 'hours').format(this.dateTimeConfig.format);
            }
            this.customerMeeting.patchValue({
              [key]: meeting[key]
            });
          }
          for (let key in previousNotesValues) {
            if (previousNotesValues[key] !== undefined && previousNotesValues[key] !== "") {
              this.labelTabs[key] += (this.labelTabs[key].indexOf(" *") > -1) ? "" : " *";
            }
          }
          this.microsoftId = meeting['microsoftId'];
          this.customerNameTitle = meeting['customerName'];

          MeteorObservable.call('findOne', 'customers', {
            _id: meeting['customerId']
          }).subscribe(customer => {
            this.customerId = customer['_id'];
            this.customerNumber = customer['customer'];
            this.customerAddress = customer["address1"] + ", " +
              customer["city"] + ", " +
              customer["state"] + ", " +
              customer["zipCode"];
            this.pageHeaderInput = `Customer Meetings > ${this.customerNumber} - ${this.customerNameTitle}`;

            this.isDataReady = true;
          })

          if (meeting['status'] === "Complete") {
            this.completeStatus = true;
          }
        })
      } else {
        this.endDateTimeConfig['min'] = newMeeting.dateTime;
        this.isDataReady = true;
      }
    });

    MeteorObservable.call('returnUser', Meteor.userId()).subscribe(user => {
      this.email = user["emails"][0].address;
      this.customerMeeting.patchValue({
        userName: user["profile"].firstName + " " + user["profile"].lastName
      });
    })

    this.customerMeeting.get("dateTime").valueChanges.subscribe(value => {
      if (this.dateToDp !== undefined) {
        this.dateToDp.config = {
          min: value,
          ...this.dateTimeConfig
        }
      }
    });
  }

  addMeeting() {
    if (!this.meetingId) {
      let email = this.email;
      let eventData = {
        subject: this.customerMeeting.value.customerName + " " + this.customerMeeting.value.branch,
        start: {
          "dateTime": moment(new Date(this.customerMeeting.value.dateTime)).format().toString(),
          "timeZone": "UTC"
        },
        end: {
          "dateTime": moment(new Date(this.customerMeeting.value.endDateTime)).format().toString(),
          "timeZone": "UTC"
        },
      };
      let data = {
        email: email,
        eventData: eventData
      };

      this.callMethod(data);
    }
  }

  generate365Data() {
    let email = this.email;
    let eventData = {
      subject: this.customerMeeting.value.customerName + " " + this.customerMeeting.value.branch,
      start: {
        "dateTime": moment(new Date(this.customerMeeting.value.dateTime)).format().toString(),
        "timeZone": "UTC"
      },
      end: {
        "dateTime": moment(new Date(this.customerMeeting.value.endDateTime)).format().toString(),
        "timeZone": "UTC"
      },
    };
    let data = {
      email: email,
      eventData: eventData
    };

    return data;
  }

  addToMicroSoft365(data) {
    return this.methodFor365(data, "POST", '/addMeeting');
  }

  async callMethod(data) {
    this.isDataReady = false;
    let eventResult = await this.addToMicroSoft365(data);
    // let eventResult = null;
    if (eventResult !== null && eventResult !== "" && eventResult !== undefined) {
      this.customerMeeting.patchValue({
        microsoftId: eventResult['id'],
      });

      let meetingObj = this.customerMeeting.value;
      meetingObj['dateTime'] = new Date(this.customerMeeting.value.dateTime);
      meetingObj['endDateTime'] = new Date(this.customerMeeting.value.endDateTime);
      meetingObj['tenantId'] = Session.get('tenantId');

      MeteorObservable.call('insert', 'customerMeetings', meetingObj).subscribe((res: any) => {
        this._service.success(
          "New Meeting Added",
          this.customerMeeting.value.customerName, {
            timeOut: 5000,
            showProgressBar: true,
            pauseOnHover: false,
            clickToClose: false,
            maxLength: 10
          }
        );
        this.router.navigate(['customers/meetings/']);
      });
    } else {
      this.isDataReady = true;
      this._service.error(
        "Meeting Not Added",
        'Contact Support', {
          timeOut: 5000,
          showProgressBar: true,
          pauseOnHover: false,
          clickToClose: false,
          maxLength: 10
        }
      )
      let emailData = {
        to: "support@globalthesource.com",
        from: this.email,
        bcc: "",
        subject: this.customerMeeting.value.userName + ' - Issue Submitting Meeting',
        html: ""
      };
      emailData.html = `Meeting could not be submitted. No Microsoft ID created.<br>`;
      emailData.html += `<h3>Meeting Info:</h3>`;
      emailData.html += `<strong>Customer: </strong> ` + this.customerMeeting.value.customerName + `<br>`;
      emailData.html += `<strong>CustomerId: </strong> ` + this.customerMeeting.value.customerId + `<br>`;
      emailData.html += `<strong>Branch: </strong> ` + this.customerMeeting.value.branch + `<br>`;
      emailData.html += `<strong>Meeting Date: </strong> ` + this.customerMeeting.value.dateTime + `<br>`;
      MeteorObservable.call('sendSupportEmail', emailData).subscribe(meeting => { })
    }
  }

  setMeeting(meeting) {
    this.customerMeeting = meeting;
  }

  getMeeting() {
    return this.customerMeeting;
  }

  async _addMeeting(customerMeeting) {
    this.isDataReady = false;

    let meetingId = await this._addMeetingToDatabase(customerMeeting);
    if (!funcs.isEmptyString(meetingId)) {
      // if get meeting id
      this.meetingId = meetingId;
      this.isDataReady = true;
      this.router.navigate(['customers/meetings/']);
    } else {
      // failed
    }
  }

  async _addMeetingToDatabase(customerMeeting) {
    this.customerMeeting = customerMeeting;
    let data = this.generate365Data();
    let eventResult = await this.addToMicroSoft365(data);

    if (!funcs.isEmptyObject(eventResult)) {
      customerMeeting.patchValue({
        microsoftId: eventResult['id'],
      });
    }

    let meetingObj = customerMeeting.value;
    meetingObj['dateTime'] = new Date(customerMeeting.value.dateTime);
    meetingObj['endDateTime'] = new Date(customerMeeting.value.endDateTime);
    meetingObj['tenantId'] = Session.get('tenantId');

    let insertResult:any = await funcs.callbackToPromise(MeteorObservable.call('insert', 'customerMeetings', meetingObj));

    if (!funcs.isEmptyString(insertResult.result)) {
      EventEmitterService.Events.emit({
        componentName: 'dashboard',
        type: 'success',
        title: 'New Meeting Added',
        content: this.customerMeeting.value.customerName
      });
    } else {
      EventEmitterService.Events.emit({
        componentName: 'dashboard',
        type: 'error',
        title: 'Meeting Not Added',
        content: 'Contact Support'
      });
    }

    let log = {
      _id: Random.id(),
      collectionName: 'customerMeetings',
      document: insertResult.result,
      log: 'customers/meetings/create, ' + this.customerId + ', ' + this.customerMeeting.value.branch,
      date: new Date(),
    };
    funcs.log(PageResolver.systemLog._id, log);

    return insertResult.result;
  }

  async _completeMeeting(customerMeeting) {
    this.showCompleteButton = false;
    this.isDataReady = false;

    if (this.meetingId) {
      // if this.meeting id exists, update meeting

      MeteorObservable.call('update', 'customerMeetings', {
        _id: this.meetingId
      }, {
        $set: {
          status: 'Complete'
        }
      }).subscribe(res => {
        if (res > 0) {
          this._sendEmail(customerMeeting.value);
        } else {
          let value = {
            _id: Random.id(),
            collectionName: 'Failed to Complete Meeting',
            type: null,
            field: null,
            log: JSON.stringify(customerMeeting.value),
            date: new Date(),
          }
          funcs.log(PageResolver.systemLog._id, value);
        }
      })
    } else {
      // if meething id doesn't exist, add a new completed meeting

      let meetingId = await this._addMeetingToDatabase(customerMeeting);
      this.meetingId = meetingId;
      if (meetingId) {

        this._sendEmail(customerMeeting.value);
      }
    }
    this.router.navigate(['customers/meetings/']);
  }

  addCustomer(result) {
    if (!this.completeStatus) {
      if (result) {
        this.customerMeeting.patchValue({
          customerName: result.name,
        });

        MeteorObservable.call('findOne', 'customers', {
          customer: result.customer
        }).subscribe(customer => {
          this.customerMeeting.patchValue({
            customerId: customer["_id"]
          });

          this.customerAddress = customer["address1"] + ", " +
            customer["city"] + ", " +
            customer["state"] + ", " +
            customer["zipCode"];

          this.customerId = customer["_id"];
          this.documentId = customer["_id"];

          if (customer['branches'].length === 0) {
            this.customerHasNoBranches = true;

            if (customer['address1'] !== "" && customer['city'] !== "" && customer['state'] !== "" && customer['zipCode'] !== "") {
              this.customerMeeting.patchValue({
                branch: (customer['address1'] + ", " + customer['city'] + ", " + customer['state'] + ", " + customer['zipCode']).trim()
              });
            } else {
              this.customerMeeting.patchValue({
                branch: ""
              });
            }

            if (this.meetingId) {
              this.updateCustomerAndBranch();
            }

          } else {
            //clear branch
            this.customerHasNoBranches = false;
            this.customerMeeting.patchValue({
              branch: ""
            });
          }
        })
      }
      this.showView('');
    }
  }

  async _sendEmail(meetingValue) {
    this.notesObj = {
      salesNotes: meetingValue.salesNotes,
      pricingNotes: meetingValue.pricingNotes,
      customerServiceNotes: meetingValue.customerServiceNotes,
      coolAirNotes: meetingValue.coolAirNotes,
      marketingNotes: meetingValue.marketingNotes,
      turboNotes: meetingValue.turboNotes,
      ditekNotes: meetingValue.ditekNotes,
      ductTiesNotes: meetingValue.ductTiesNotes,
      hungRiteNotes: meetingValue.hungRiteNotes
    };
    let query = {
      name: {
        "$in": ['meetingNotesPricing',
          'meetingNotesSales',
          'meetingNotesService',
          // 'meetingNotesReceivable',
          'meetingNotesCoolAir',
          'meetingNotesMarketing',
          'meetingNotesDitek',
          'meetingNotesTurbo200',
          'meetingNotesHungRite',
          'meetingNotesDuctTies',
        ]
      }
    };

    let result:any = await funcs.callbackToPromise(MeteorObservable.call('find', 'systemAlerts', query));

    result.forEach(async (alert) => {
      let emailObj = {
        identifier: alert['email'].identifier,
        emails: alert['email'].to,
        subject: alert['email'].subject,
        from: alert['email'].from,
      }
      emailObj.from = (alert['email'].from !== null &&
        alert['email'].from !== undefined &&
        alert['email'].from !== "") ? alert['email'].from : this.email;

      if (emailObj.identifier !== undefined &&
        this.notesObj[emailObj.identifier] !== undefined &&
        this.notesObj[emailObj.identifier] !== "") {

        let emailData = {
          to: "",
          from: "",
          bcc: "",
          subject: meetingValue.customerName,
          html: ""
        };

        emailData.to = emailObj.from;
        emailData.from = emailObj.from;
        emailData.bcc = emailObj.emails;
        emailData.subject = emailObj.subject + meetingValue.customerName;
        // emailData.html += `<strong>Notes: </strong> ` + this.notesObj[emailObj.identifier]
        let variables = {
          logo: 'https://app.yibas.com/img/Global-White.png',
          Customer: meetingValue.customerName,
          Address: this.customerAddress,
          Branch: meetingValue.branch,
          SalesPerson: Meteor.user().profile.firstName + ' ' + Meteor.user().profile.lastName,
          Date: meetingValue.dateTime,
          MeetingNotes: this.notesObj[emailObj.identifier]
        };

        let managerUsers:any = await funcs.callbackToPromise(MeteorObservable.call('getManagerUsers'));
        let str = ', ';
        managerUsers.forEach((user, index) => {
          let temp = '';
          if (index == managerUsers.length-1) {
            temp = user.username;
          } else {
            temp = user.username + ', ';
          }
          str = str + temp;
        });
        emailData.bcc = emailData.bcc + str;
        MeteorObservable.call('sendEmail', emailData, 'html-email.html', variables).subscribe(emailResponse => {
          if (emailResponse){
            let value = {
              _id: Random.id(),
              collectionName: 'Failed Meeting Email',
              type: null,
              field: null,
              log: JSON.stringify(emailResponse),
              date: new Date(),
            }
            funcs.log(PageResolver.systemLog._id, value);
          }
        })
      }
    })
  }

  addBranch(result) {
    if (!this.customerHasNoBranches && !this.completeStatus) {
      if (result) {
        if (!this.customerId) {
          //adds customer info if selecting branch first
          MeteorObservable.call('findOne', 'customers', {
            _id: result._id
          }).subscribe(customer => {
            this.customerMeeting.patchValue({
              customerId: customer["_id"],
              customerName: customer["name"]
            });


            this.customerId = customer["_id"];
            this.documentId = customer["_id"];
          })
        }
        this.labelTabs = _.mapObject(this.labelTabs, function (val, key) {
          if (val.indexOf(" *") > -1) {
            return val.replace(" *", "");
          } else {
            return val;
          }
        });
        this.customerMeeting.patchValue({
          branchShipTo: result.shipTo
        });

        let branch = result.address1 + ", " + result.city + ", " + result.state + ", " + result.zipCode
        if (result.name !== "") {
          branch = result.name + ", " + branch
        }
        this.customerMeeting.patchValue({
          branch: branch
        });

        if (this.meetingId) {
          this.updateCustomerAndBranch();
        }

        if (!this.meetingId) {
          let query = [{
            $match: {
              customerId: this.customerId,
              branchShipTo: result.shipTo
            }
          },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
              }
            },
            {
              $unwind: "$user"
            },
            {
              $limit: 5
            }
          ];

          MeteorObservable.call('aggregate', 'customerMeetings', query).subscribe(branchMeetings => {

            this.previousNotes = {
              customerService: [],
              ditek: [],
              hungRite: [],
              marketing: [],
              ductTies: [],
              pricing: [],
              coolAir: [],
              sales: [],
              turbo: []
            }

            for (let i = 0; i < Object.keys(branchMeetings['result']).length; i++) {
              let previousNotesValues = {
                customerService: branchMeetings['result'][i].customerServiceNotes,
                ditek: branchMeetings['result'][i].ditekNotes,
                hungRite: branchMeetings['result'][i].hungRiteNotes,
                marketing: branchMeetings['result'][i].marketingNotes,
                ductTies: branchMeetings['result'][i].ductTiesNotes,
                pricing: branchMeetings['result'][i].pricingNotes,
                coolAir: branchMeetings['result'][i].coolAirNotes,
                sales: branchMeetings['result'][i].salesNotes,
                turbo: branchMeetings['result'][i].turboNotes,
              }
              let userInfo = branchMeetings['result'][i].user['profile'].firstName + " " + branchMeetings['result'][i].user['profile'].lastName;
              let meetingDate = moment(new Date(branchMeetings['result'][i].dateTime)).format('D MMM, YYYY');

              for (let key in previousNotesValues) {
                if (previousNotesValues[key] !== undefined && previousNotesValues[key] !== "") {
                  this.labelTabs[key] += (this.labelTabs[key].indexOf(" *") > -1) ? "" : " *";
                  this.previousNotes[key].push({
                    note: previousNotesValues[key],
                    userInfo: userInfo,
                    meetingDate: meetingDate
                  })
                }
              }
            }
          })
        }
      }
    }
    this.showView('');
  }

  updateCustomerAndBranch() {
    let query = {
      _id: this.meetingId
    };
    let update = {
      $set: {
        customerId: this.customerId,
        branch: this.customerMeeting.value.branch,
        customerName: this.customerMeeting.value.customerName
      }
    };

    MeteorObservable.call('update', 'customerMeetings', query, update).subscribe(res => {})
    this.edit365();

  }

  onBlurMethod(field, value) {
    if (this.meetingId) {
      let query = {
        _id: this.meetingId
      }
      let update = {}
      if (field === 'dateTime' || field === 'endDateTime') {
        update = {
          $set: {
            [field]: new Date(value),
          }
        };
        if (this.microsoftId) {
          this.edit365()
        }
      } else {
        update = {
          $set: {
            [field]: value
          }
        };
      }
      if (value !== 'Complete' && value !== undefined) {
        MeteorObservable.call('update', 'customerMeetings', query, update).subscribe(res => {})
      }
    }

    if (field === 'status' && value === "Complete") {
      this.showCompleteButton = true;
    } else if (field === 'status' && value !== "Complete") {
      this.showCompleteButton = false;
    }
  }

  completeMeeting() {
    this.showCompleteButton = false;
    const meetingValue = this.customerMeeting.value;
    this.notesObj = {
      salesNotes: meetingValue.salesNotes,
      pricingNotes: meetingValue.pricingNotes,
      customerServiceNotes: meetingValue.customerServiceNotes,
      coolAirNotes: meetingValue.coolAirNotes,
      marketingNotes: meetingValue.marketingNotes,
      turboNotes: meetingValue.turboNotes,
      ditekNotes: meetingValue.ditekNotes,
      ductTiesNotes: meetingValue.ductTiesNotes,
      hungRiteNotes: meetingValue.hungRiteNotes
    }
    if (this.meetingId) {
      MeteorObservable.call('update', 'customerMeetings', {
        _id: this.meetingId
      }, {
        $set: {
          status: 'Complete'
        }
      }).subscribe(res => {
        if (res > 0) {
          this.sendEmail(meetingValue);
        } else {
          let value = {
            _id: Random.id(),
            collectionName: 'Failed to Complete Meeting',
            type: null,
            field: null,
            log: JSON.stringify(meetingValue),
            date: new Date(),
          }
          funcs.log(PageResolver.systemLog._id, value);
        }

      })
    } else if (this.meetingId === undefined) {
      this.addMeeting();
    }
  }

  sendEmail(meetingValue) {
    //***************EMAIL NOTES*********
    if (!this.completeStatus) {
      let noteEmails = {};
      let noteEmailSubjects = {};
      let noteEmailSendInfo = {};
      let query = {
        name: {
          "$in": ['meetingNotesPricing',
            'meetingNotesSales',
            'meetingNotesService',
            // 'meetingNotesReceivable',
            'meetingNotesCoolAir',
            'meetingNotesMarketing',
            'meetingNotesDitek',
            'meetingNotesTurbo200',
            'meetingNotesHungRite',
            'meetingNotesDuctTies',
          ]
        }
      }
      MeteorObservable.call('find', 'systemAlerts', query).subscribe((alerts: any[]) => {
        for (let i = 0; i < alerts.length; i++) {
          let emailObj = {
            identifier: alerts[i]['email'].identifier,
            emails: alerts[i]['email'].to,
            subject: alerts[i]['email'].subject,
            from: alerts[i]['email'].from,
          }
          emailObj.from = (alerts[i]['email'].from !== null &&
            alerts[i]['email'].from !== undefined &&
            alerts[i]['email'].from !== "") ? alerts[i]['email'].from : this.email;

          if (emailObj.identifier !== undefined &&
            this.notesObj[emailObj.identifier] !== undefined &&
            this.notesObj[emailObj.identifier] !== "") {

            let emailData = {
              to: "",
              from: "",
              bcc: "",
              subject: meetingValue.customerName,
              html: ""
            };

            let html = `A meeting has been completed!<br>`;
            html += `<h3>Meeting Info:</h3>`;
            html += `<strong>Customer: </strong> ` + meetingValue.customerName + `<br>`;
            html += `<strong>Branch: </strong> ` + meetingValue.branch + `<br>`;
            html += `<strong>Sales Person: </strong> ` + Meteor.user().profile.firstName + Meteor.user().profile.lastName + `<br>`;
            html += `<strong>Meeting Date: </strong> ` + meetingValue.dateTime + `<br>`;

            // emailData.html = html;
            emailData.to = emailObj.from;
            emailData.from = emailObj.from;
            emailData.bcc = emailObj.emails;
            emailData.subject = emailObj.subject + meetingValue.customerName;
            // emailData.html += `<strong>Notes: </strong> ` + this.notesObj[emailObj.identifier]
            let variables = {
              logo: 'https://app.yibas.com/img/Global-White.png',
              Customer: meetingValue.customerName,
              Address: this.customerAddress,
              Branch: meetingValue.branch,
              SalesPerson: Meteor.user().profile.firstName + ' ' + Meteor.user().profile.lastName,
              Date: meetingValue.dateTime,
              MeetingNotes: this.notesObj[emailObj.identifier]
            };

            MeteorObservable.call('sendEmail', emailData, 'html-email.html', variables).subscribe(emailResponse => {
              if (emailResponse){
                let value = {
                  _id: Random.id(),
                  collectionName: 'Failed Meeting Email',
                  type: null,
                  field: null,
                  log: JSON.stringify(emailResponse),
                  date: new Date(),
                }
                funcs.log(PageResolver.systemLog._id, value);
              }
            })
          }
        }
      })
    } else {

    }
    if (this.meetingId !== undefined) {
      this.router.navigate(['customers/meetings/']);
    }
  }

  closed() {
    let datetime = moment(new Date(this.customerMeeting.value.dateTime)).add(1, 'hours').format(this.dateTimeConfig.format);
    this.customerMeeting.patchValue({
      endDateTime: datetime
    });
    this.onBlurMethod('endDateTime', datetime);
  }

  edit365() {
    let eventData = {
      subject: this.customerMeeting.value.customerName + " " + this.customerMeeting.value.branch,
      start: {
        "dateTime": moment(new Date(this.customerMeeting.value.dateTime)).format().toString(),
        "timeZone": "UTC"
      },
      end: {
        "dateTime": moment(new Date(this.customerMeeting.value.endDateTime)).format().toString(),
        "timeZone": "UTC"
      },
    };

    let data = {
      email: this.email,
      microsoftId: this.microsoftId,
      eventData: eventData,
    };

    this.methodFor365(data, 'PATCH', '/editMeeting');
  }

  delete() {
    MeteorObservable.call('remove', 'customerMeetings', {
      _id: this.meetingId
    }, true).subscribe(res => {
      this._service.success(
        'Success',
        'Removed Successfully'
      );
    });

    let data = {
      email: this.email,
      microsoftId: this.microsoftId
    };

    this.methodFor365(data, 'DELETE', '/deleteMeeting');

    this.router.navigate(['customers/meetings/']);
  }

  methodFor365(data, httpMethod, functionName) {
    return new Promise(resolve => {
      HTTP.call('GET', '/auth', {
        content: 'string'
      }, (err, tokenResult) => {
        if (!err) {
          let token = tokenResult.content;
          data['token'] = token;
          HTTP.call(httpMethod, functionName, {
              data
            },
            (err, eventResult) => {
              if (!err && functionName === '/addMeeting') {
                let event = JSON.parse(eventResult.content);
                resolve(event);
              } else {
                resolve('')
              }
            });
        }
      });
    })
  }

  showView(view) {
    this.view = view;
    this._router.navigate([], { queryParams: { view }, queryParamsHandling: 'merge' })
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(DeleteDialog, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete();
      }
    });
  }

  insertMeeting() {

  }
}

@Component({
  selector: 'deleteDialog',
  templateUrl: 'deleteDialog.html',
})
export class DeleteDialog {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialog>) { }

  click(result): void {
    this.dialogRef.close(result);
  }

}
