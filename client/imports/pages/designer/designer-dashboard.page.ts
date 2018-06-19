import {Component} from "@angular/core";
import {EventEmitterService} from "../../services";

@Component({
  selector: 'designer-dashboard',
  template: `
    <div>
      <button mat-raised-button color="primary" (click)="onSetTheme('default-theme')">Default</button>
      <button mat-raised-button color="warn" (click)="onSetTheme('dark-theme')">Dark</button>
      <button mat-raised-button color="primary" (click)="onSetTheme('light-theme')">Light</button>
    </div>
  `
})export class DesignerDashboardPage {
  constructor() {

  }

  onSetTheme(theme) {
    EventEmitterService.Events.next({
      name: 'setTheme',
      value: theme
    });
  }
}