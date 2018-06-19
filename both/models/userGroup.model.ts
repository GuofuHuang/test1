// has default, belongs to tenantId
export interface UserGroup {
  _id?: string;
  name: string;
  groupPermissions: any[];
  tenants: any[];
  removed: string;
  parentTenantId: string;
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
}
