import {MongoObservable} from "meteor-rxjs";
import { CustomerMeeting } from  '../models/customerMeeting.model';

export const CustomerMeetings = new MongoObservable.Collection<CustomerMeeting>('customerMeetings');