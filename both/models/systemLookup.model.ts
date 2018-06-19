// has default, belongs to tenantId
export interface SystemLookup {
  _id?: string;
  name: string;
  label: string; // this is used by the dialog-system-lookup
  searchable: boolean;

  subscriptions: Subscription[];
  methods: Method[];
  dataTable: DataTable;
  userId: string;
  tenantId: string;
  parentTenantId: string;
  removed: boolean;
  createdUserId: string;
  createdAt: Date;
}

interface Subscription {
  name: string;
  args: Argument[] // argument can be a query object, options object, etc.
}

interface Argument {
  name: string;
  value: any; // value can be an object or an array
  params: string[]
}

interface Method {
  isHeader?: boolean; // isHeader is used to deal with multi aggregate or find, when isHeader is false, it means that it is called by another method
  name: string;
  collectionName: string;
  args: Argument[];
  return: Return;
}

interface Return {
  // used for returned data when a item is clicked
  returnable: boolean;
  data: string[]; // used to defined what data to be returned when selected

  // used for multi aggregate or find
  next: boolean; // determine if there is next method to be called
  nextMethodIndex: Number; // the index of the method to be called next
  dataType: string; // this could be 'object', 'array'
  as: string; // name of the data to returned
}

interface DataTable {
  table: any; // options for table
  columns: {}[]; // options for columns
  rows: any; // options for rows
}
