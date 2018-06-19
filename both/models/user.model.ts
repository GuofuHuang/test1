import { Meteor } from 'meteor/meteor';

import { Profile } from '../models/profile.model';

export interface User extends Meteor.User {
  profile?: Profile;
  groups?: {}[];
  tenants?: Tenant[];
  removed?: boolean;
  parentTenantId?: string;
  // createdAt?: Date;
  manages?: string[];
  username?: string;
  creaatedUserId?: string;
  status?: Status
}

interface Tenant {
  lookups: any[];
  groups: string[];
}

interface Status {
  editable: boolean;
}
