import { Component, OnInit, NgZone } from '@angular/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { Users } from '../../../../../both/collections/users.collection';
import { User } from '../../../../../both/models/user.model';

@Component({
  selector: 'user-dropdown',
  templateUrl: 'user-dropdown.component.html'
})

export class UserDropdownComponent implements OnInit {
  users: Observable<User[]>;
  user: User = {
    profile: {}
  };

  constructor(private ngZone: NgZone, private router: Router) {
  }

  ngOnInit() {
    MeteorObservable.autorun().subscribe(() => {
      Users.find({}).zone().subscribe((res) => {
        this.user = res[0];
      });
    });
  }

  logout() {
    Meteor.logout(() => {
      localStorage.setItem('sessionId', '');
      this.router.navigate(['/login']);
    });
    // this.router.navigate(['/login']);

  }
}