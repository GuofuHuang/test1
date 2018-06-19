import {MeteorObservable} from "meteor-rxjs";
import * as moment from 'moment-timezone';
import {SystemTenants} from "../collections/systemTenants.collection";
import { Logo } from './image';
import * as _ from "underscore";
import {callbackToPromise} from "./common";


export function deleteUserFilter(filterName, lookupName, parentTenantId) {
  const query = {
    name: filterName,
    lookupName,
    parentTenantId
  };
  return MeteorObservable.call('deleteUserFilter', query, {justOne: true}).subscribe();
}