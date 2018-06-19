import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import InventoryPages from './index';

let routes: Routes = [
  { path: '', redirectTo: 'info' },
  { path: 'info', component: InventoryPages['InventoryInfoPage'] },
  { path: 'categories', component: InventoryPages['InventoryCategoriesPage'] },
  { path: 'categories/:documentId', component: InventoryPages['InventoryCategoryPage'] },
];
let p = RouterModule.forChild(routes);

export const routing: ModuleWithProviders = RouterModule.forChild(routes);