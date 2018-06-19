export interface SystemTenantModal {
  _id?: string;
  name: string;
  logo?: string;
  scheme?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: number;
  numberOfUsers?: number;
  subDomain?: string;
  parentTenantId?: string;
  modules: string[];
  userId?: string;
  createdUserId?: string;
  createdAt?: Date;
  removed?: boolean;
  default?: boolean;
}

export class SystemTenant {
  name: string;
  logo: string;
  scheme: string;
  address1: string;
  address2: string;
  subdomain: string;
  createdUserId: string;
  createdAt: Date;
  modules: string[];
  city: string;
  removed: string;
  parentTenantId: string;
  zip: string;
  state: string;

  endDateTime: string;
  userId: string;

  constructor() {

  }
}