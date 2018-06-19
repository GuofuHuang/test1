import { Injectable } from '@angular/core';
import ExecutivePages from './components';
import { ExecutiveItem } from './executive-item';
import {ExecutiveFreightreportPage} from "./components/executive-freightreport.page";
import {ExecutiveDashboardPage} from "./components/executive-dashboard.page";
import {ExecutiveOpenordersPage} from "./components/executive-openorders.page";
import {ExecutiveLookupPage} from "./components/executive-lookup.page";
import { ExecutiveBorrowingBasePage} from "./components/executive-borrowingBase.page";
import { ExecutiveBankingBalancePage} from "./components/executive-bankingBalance.page";
import { ExecutiveMonthlySalesPage} from "./components/executive-monthlySales.page";
import { ExecutiveYearlySalesPage} from "./components/executive-yearlySales.page";
import { ExecutiveInventoryPage} from "./components/executive-inventory.page";

@Injectable()
export class ExecutiveService {
  getExecutiveItems() {
    let arr = [];
    Object.keys(ExecutivePages).forEach(key => {
      let item = new ExecutiveItem(key, ExecutivePages[key], {});
      arr.push(item);
    });
    return arr;
  }
}
