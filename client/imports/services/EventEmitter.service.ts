import {EventEmitter, Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class EventEmitterService {
  static Events:EventEmitter<any> = new EventEmitter <any>();

  constructor() {
  }

}