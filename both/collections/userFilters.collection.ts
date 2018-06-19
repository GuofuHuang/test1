import { MongoObservable } from 'meteor-rxjs';
import { UserFilter } from  '../models/userFilter.model';

export const UserFilters = new MongoObservable.Collection<UserFilter>('userFilters');