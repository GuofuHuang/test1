import {Injectable, OnInit} from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AppState } from '../../../both/models/appState';

@Injectable()
export class GlobalVariablesService implements OnInit{

  static scrolling = true;
  constructor() {}

  ngOnInit() {

  }
}