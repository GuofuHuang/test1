import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import '../methods/database.js';

export class DatabaseService {
  public _conn: any;
  constructor() {}
  public newConnection(dbUrl) {
    return new MongoInternals.RemoteCollectionDriver(dbUrl);
    // return Meteor.call('connectDB', dbUrl);
  }
  set conn(conn) {
    this._conn= conn;
  }

  get conn() {
    return this._conn;
  }

}