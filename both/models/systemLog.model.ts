// has default, belongs to tenantId
export interface SystemLog {
  _id?: string;
  sessionId: string;
  actions: Array<Action>;
  parentTenantId: string;
  createdUserId: string;
  createdAt?: Date;
}

export interface Action {
  path: string;
  type: string;
  date: Date;
  log: string;
  documentId: string;
  document: string;
  collectionName: string;
  value: any;
  previousValue: any;
}