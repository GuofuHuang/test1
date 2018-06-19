import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import AdminPages from './index';

const routes: Routes = [
  { path: '', redirectTo: 'logs' },
  { path: 'logs', component: AdminPages['AdminLogsPage'] },
  { path: 'users', component: AdminPages['AdminUsersPage'] },
  { path: 'users/:documentId', component: AdminPages['AdminUserPage'] },
  { path: 'permissions', component: AdminPages['AdminPermissionsPage'] },
  { path: 'permissions/:documentId', component: AdminPages['AdminPermissionPage'] },
  { path: 'groups', component: AdminPages['AdminGroupsPage'] },
  { path: 'groups/:documentId', component: AdminPages['AdminGroupPage'] },
  { path: 'tenants', component: AdminPages['AdminTenantsPage'] },
  { path: 'tenants/:documentId', component: AdminPages['AdminTenantPage'] },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
