import * as moment from 'moment';
import {dateTimeFormat} from '../config/systemConfig';

export class NewCustomerMeeting {
  status: string;
  tenantId: string;
  dateTime: string;
  endDateTime: string;
  userId: string;

  constructor() {
    const roundedUp = Math.ceil(moment().minute() / 15) * 15;

    this.dateTime = moment().minute(roundedUp).second(0).format(dateTimeFormat);
    this.endDateTime = moment(new Date(this.dateTime)).add(1, 'hours').format(dateTimeFormat);
    this.status = 'Pending';
    this.userId = Meteor.userId();
    this.tenantId = Session.get('tenantId');
  }
}

export interface CustomerMeeting {
  _id : string;
  description : string;
  dateTime : Date;
  endDateTime : Date;
  branch : string;
  status : string;
  salesNotes :string;
  pricingNotes : string;
  customerServiceNotes : string;
  coolAirNotes : string;
  marketingNotes : string;
  turboNotes : string;
  ditekNotes : string;
  // miniSplitNotes : string;
  hungRiteNotes : string;
  userName : string;
  customerName : string;
  userId : string;
  customerId : string;
  microsoftId : string;
  branchShipTo : string;
  tenantId : string;
  createdUserId : string;
  createdAt : Date;
}
