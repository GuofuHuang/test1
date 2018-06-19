import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import DeveloperPages from './index';

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'dashboard', component: DeveloperPages['DesignerDashboardPage'] },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
