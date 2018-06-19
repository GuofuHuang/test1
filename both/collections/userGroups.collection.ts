// has default, belongs to tenantId

import {MongoObservable} from "meteor-rxjs";
import { UserGroup } from  '../models/userGroup.model';

export const UserGroups = new MongoObservable.Collection<any>('userGroups');

