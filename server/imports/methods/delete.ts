import { AllCollections } from '../../../both/collections';

Meteor.methods({
  deleteUserFilter(query, options) {
    AllCollections['userFilters'].remove(query, options);
  }
});