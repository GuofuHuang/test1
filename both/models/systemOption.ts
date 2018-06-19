import * as funcs from "../functions/common";
import {SystemModule} from "./systemModule";
import {OnInit} from "@angular/core";
import {MeteorObservable} from "meteor-rxjs";

export interface SystemOption {
    _id?: string;
    name: string;
    value: value[]
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}

interface value {
}

export class SystemOptionClass implements OnInit{
  constructor(
    _id: string,
    name: string,
    value: value[],
    createdUserId: string,
    createdAt: Date,
    removed: boolean,
    tenantId: string
) {}

  static async LoadSystemOptions(query) {
    return await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemOptions', query));
  }

  ngOnInit() {

  }
}
