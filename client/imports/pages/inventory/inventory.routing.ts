import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import InventoryPages from './index';
import {InventoryInfoPage} from "./inventory-info.page";
import {InventoryCategoriesPage} from "./inventory-categories.page";
import {InventoryCategoryPage} from "./inventory-category.page";

let routes: Routes = [
  { path: '', redirectTo: 'info' },
  { path: 'info', component: InventoryInfoPage },
  { path: 'categories', component: InventoryCategoriesPage },
  { path: 'categories/:documentId', component: InventoryCategoryPage },
];
let p = RouterModule.forChild(routes);

export const routing: ModuleWithProviders = RouterModule.forChild(routes);