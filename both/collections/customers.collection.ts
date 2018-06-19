import {MongoObservable} from "meteor-rxjs";
import { Customer } from  '../models/customer.model';

export const Customers = new MongoObservable.Collection<Customer>('customers');

Customers.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});