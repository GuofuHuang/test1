import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import DeveloperPages from './index';
import {DeveloperAlertsPage} from "./developer-alerts.page";
import {DeveloperSystemLookupsPage} from "./developer-systemLookups.page";
import {DeveloperSystemLookupPage} from "./developer-systemLookup.page";
import {DeveloperParentTenantsPage} from "./developer-parent-tenants.page";
import {DeveloperCreateParentTenantPage} from "./developer-create-parent-tenant.page";
import {DeveloperParentTenantPage} from "./developer-parent-tenant.page";
import {GuofuTestingPage} from "./guofu-testing/guofu-testing.page";
import {JoeTestingPage} from "./joe-testing/joe-testing.page";
import {DeveloperUrltoolPage} from "./developer-urltool.page";
import {DeveloperSynctoolPage} from "./developer-synctool.page";

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'alerts', component: DeveloperAlertsPage },
  { path: 'lookups', component: DeveloperSystemLookupsPage },
  { path: 'lookups/:documentId', component: DeveloperSystemLookupPage },
  { path: 'parenttenants', component: DeveloperParentTenantsPage },
  { path: 'parenttenants/create', component: DeveloperCreateParentTenantPage },
  { path: 'parenttenants/:documentId', component: DeveloperParentTenantPage },
  { path: 'guofutest', component: GuofuTestingPage },
  { path: 'joetest', component: JoeTestingPage },
  { path: 'urltool', component: DeveloperUrltoolPage },
  { path: 'synctool', component: DeveloperSynctoolPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
