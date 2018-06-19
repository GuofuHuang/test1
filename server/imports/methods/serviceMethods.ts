import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Profile} from '../../../both/models/profile.model';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
import * as Util from 'util';
import { AllCollections } from '../../../both/collections';
import { SystemOptions } from '../../../both/collections/systemOptions.collection';
import { SystemModules } from '../../../both/collections/systemModules.collection';
import { SystemTenants } from '../../../both/collections/systemTenants.collection';
import { UserGroups } from '../../../both/collections/userGroups.collection';
import { UserPermissions } from '../../../both/collections/userPermissions.collection';
import { Users } from '../../../both/collections/users.collection';
import { Categories } from '../../../both/collections/categories.collection';
import { SystemLookups } from '../../../both/collections/systemLookups.collection';
import { CustomerMeetings } from '../../../both/collections/customerMeetings.collection';
import { Customers } from '../../../both/collections/customers.collection';
import { CustomerInvoices } from '../../../both/collections/customerInvoices.collection';
import { generateRegexWithKeywords } from '../../../both/functions/common';
import * as moment from 'moment';


Meteor.methods({
  getLogOptions() {
    let result = SystemOptions.collection.findOne({name: 'logOptions'});
    return result;
  },
  // getCurrentUserGroups() {
  //   let result = Users.collection.findOne(this.userId, {fields: {"tenants.groups": 1}});
  //   return result;
  // },
  getCurrentUser() {
    let result = Users.collection.findOne(this.userId, {fields: {profile: 1, tenants: 1, status: 1}});
    return result;
  }
})