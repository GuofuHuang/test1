import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import DeveloperPages from './index';

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'alerts', component: DeveloperPages['DeveloperAlertsPage'] },
  { path: 'lookups', component: DeveloperPages['DeveloperSystemLookupsPage'] },
  { path: 'lookups/:documentId', component: DeveloperPages['DeveloperSystemLookupPage'] },
  { path: 'parenttenants', component: DeveloperPages['DeveloperParentTenantsPage'] },
  { path: 'parenttenants/create', component: DeveloperPages['DeveloperCreateParentTenantPage'] },
  { path: 'parenttenants/:documentId', component: DeveloperPages['DeveloperParentTenantPage'] },
  { path: 'guofutest', component: DeveloperPages['GuofuTestingPage'] },
  { path: 'joetest', component: DeveloperPages['JoeTestingPage'] },
  { path: 'urltool', component: DeveloperPages['DeveloperUrltoolPage'] },
  { path: 'synctool', component: DeveloperPages['DeveloperSynctoolPage'] },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
