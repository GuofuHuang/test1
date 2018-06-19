import { CustomersMeetingsPage } from './customers-meetings.page';
import { CustomersDashboardPage } from './customers-dashboard.page';
import { CustomersInquiryPage } from './customers-inquiry.page';
// import { CustomersMeetingsMapPage } from './customers-meetings-map.page';
import { CustomersMeetingsCreateComponent } from './customers-meetings-create.component';
import { DeleteDialog } from './customers-meetings-create.component';
import { GroupByPipe } from './group-by.pipe';
import { CustomersQuotesPage } from './customers-quotes.page';
import { CustomersContractsPage } from './customers-contracts.page';
// import { CustomersContractPage } from './customers-contract.page';
import { CustomersContractsCopyPage } from './customers-contracts-copy.page';
import { CustomersContractsUpdatePage } from './customers-contracts-update.page';
import { CustomersQuoteReviewPage } from './customers-quoteReview.page';
import { CustomersCreateQuotePage, DialogSelect } from './customers-create-quote.page';
import { CustomersOrdersPage } from './customers-orders.page';
import { CustomersOrderReviewPage } from './customers-orderReview.page';
import { CustomersInvoicesPage } from './customers-invoices.page';
import { CustomersInvoiceReviewPage } from './customers-invoiceReview.page';
import { CustomersComponent } from './customers.component';
import { TodoAddComponent } from './todo-add.component';


export const CUSTOMERS_DECLARATIONS = [
  TodoAddComponent,
  CustomersComponent,
  CustomersMeetingsPage,
  CustomersDashboardPage,
  CustomersInquiryPage,
  // CustomersMeetingsMapPage,
  CustomersMeetingsCreateComponent,
  GroupByPipe,
  CustomersQuotesPage,
  CustomersCreateQuotePage,
  CustomersQuoteReviewPage,
  CustomersContractsPage,
  // CustomersContractPage,
  CustomersOrdersPage,
  CustomersOrderReviewPage,
  CustomersInvoicesPage,
  CustomersInvoiceReviewPage,
  CustomersContractsCopyPage,
  CustomersContractsUpdatePage,
  DeleteDialog,
  DialogSelect
];
