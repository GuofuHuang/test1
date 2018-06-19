import { AllCollections } from '../../../both/collections';
import * as Util from 'util';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { generateRegexWithKeywords } from '../../../both/functions/common';

import './systemOptions.publication';
import './systemTenants.publication';
import './categories.publication';
import './customerMeetings.publication';
import './userGroups.publication';
import './users.publication';
import './userPermissions.publication';
import './systemLookups.publication';
import './warehouses.publication';
import './products.publication';

Object.keys(AllCollections).forEach((collectionName:any) => {
  const Collection = AllCollections[collectionName];
  if (collectionName == 'ledgerAccounts') {
    // console.log(Collection.collection.find({displayOnBankingBalanceCard: true}).fetch());
  }
  Meteor.publish(collectionName, function (selector: any, options: any) {

    if(collectionName == 'users' || collectionName == 'customerMeetings') {
      let result = Collection.collection.find(selector, options).fetch();
    }
    Counts.publish(this, collectionName, Collection.find(selector).cursor, {noReady: false});

    if (collectionName == 'customerInvoices' || collectionName === 'users') {
      // let result = Collection.collection.find(selector, options);
      // console.log('result', result);
    }
    return Collection.collection.find(selector, options);
  });
});
