export interface Categories {
    _id?: string;
    category: string;
    allowCustomerContract: boolean;
    allowCustomerQuote: boolean;
    priceLevel1Percent: number;
    priceLevel2Percent: number;
    priceLevel3Percent: number;
    priceLevel4Percent: number;
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}
