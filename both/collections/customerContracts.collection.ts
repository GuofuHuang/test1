import {MongoObservable} from "meteor-rxjs";
import { CustomerContract } from  '../models/customerContract.model';

export const CustomerContracts = new MongoObservable.Collection<CustomerContract>('customerContracts');
export const CopyCustomerContracts = new MongoObservable.Collection<CustomerContract>('Copy_of_customerContracts');