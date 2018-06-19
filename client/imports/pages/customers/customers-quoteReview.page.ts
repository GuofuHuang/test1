import { Component } from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import * as _ from "underscore";
import * as moment from 'moment';

@Component({
  selector: 'customers-quoteReview',
  templateUrl: "customers-quoteReview.page.html",
  styleUrls: ['customers-quoteReview.page.scss'],
})

export class CustomersQuoteReviewPage {

  constructor(public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) { }
  filterConditions: any;
  pageHeader: string;
  salesPersonEmail: string;
  quote: any = {};
  data: any = {};
  originalProducts: any = [];
  productsWithName: any = [];
  manageQuote: boolean = false;
  quoteAlertInfo: any = {};
  isDataReady: boolean = false;
  adminNotesInput: string;
  rows: any;
  contractId: string;
  capitalStatus: string;

  ngOnInit() {
    this.pageHeader = 'Customer Quotes';
    MeteorObservable.call('checkUserPermission', Meteor.userId(), 'approveCustomerQuotes').subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.manageQuote = true;
      }
    });

    MeteorObservable.call('findOne', 'systemAlerts', { name: 'completeQuoteReview' }).subscribe(quoteAlert => {
      this.quoteAlertInfo = quoteAlert;
    })

    this.route.params.subscribe((params: Params) => {
      MeteorObservable.call('findOne', 'customerQuotes', {
        _id: params['documentId']
      }).subscribe(quote => {
        this.data['quoteId'] = params['documentId'];
        this.data['customerId'] = quote['customerId'];
        this.data['currentDate'] = moment().startOf('day').format();
        this.data['yearFromCurrent'] = moment().subtract(1, 'years').startOf('day').format();
        // console.log(this.data);
        this.quote.status = quote['status'];
        this.quote.notes = (quote['notes'] === undefined || quote['notes'] === null) ? "" : quote['notes'];
        this.quote.products = quote['products'];
        this.quote.adminNotes = (quote['adminNotes'] === undefined) ? "" : quote['adminNotes'];
        this.quote.createdAt = quote['createdAt'];
        this.quote.updatedAt = quote['updatedDateTime'];
        this.capitalStatus = quote['status'].charAt(0).toUpperCase() + quote['status'].slice(1)
        MeteorObservable.call('findOne', 'customers', {
          _id: this.data['customerId']
        }).subscribe(customer => {
          this.quote.customer = customer["number"] + " - " + customer["name"];
        })
        MeteorObservable.call('findOne', 'categories', {
          _id: quote["categoryId"]
        }).subscribe(category => {
          this.quote.category = category["category"] + " - " +  category["description"];
        })
        MeteorObservable.call('findOne', 'users', {
          _id: quote["createdUserId"]
        }).subscribe(user => {
          this.quote.user = user["profile"].firstName + " " + user["profile"].lastName;
          this.salesPersonEmail = user["emails"][0].address;
        })
        // console.log(this.quote);
        this.isDataReady = true;
        this.originalProducts = this.quote.products;
      })
    })
  }

  adminNotes(event){
    // if (event.target.value !== "") {
      let query = {
        _id: this.data['quoteId']
      }
      let update = {
        $set: {
          ['adminNotes']: event.target.value
        }
      };
      MeteorObservable.call('update', 'customerQuotes', query, update).subscribe(res => {})
    // }
  }

  completeQuote(completeStatus) {
    this.isDataReady = false;
    let updateQuery = {
      _id: this.data['quoteId']
    };

    if (this.quote.adminNotes === undefined || this.quote.adminNotes === null) {
      this.quote.adminNotes = "";
    }

    let update = {
      $set: {
        adminNotes: this.quote.adminNotes,
        status: completeStatus,
        updatedUserId: Meteor.userId(),
        updatedDateTime: new Date(),
      }
    };
    // console.log(update);
    MeteorObservable.call('update', 'customerQuotes', updateQuery, update).subscribe(res => { })

    let query = [{
        $match: {
          _id: this.data['quoteId']
        }
      },
      {
        $unwind: "$products"
      },
      {
        "$lookup": {
          "from": "products",
          "localField": "products.productId",
          "foreignField": "_id",
          "as": "productInfo"
        }
      }, {
        "$unwind": "$productInfo"
      },
      {
        $project: {
          "_id": "$products.productId",
          "price": "$products.price",
          "previousPrice": "$products.previousPrice",
          "name": "$productInfo.product",
          "description": "$productInfo.description"
        }
      }
    ]
    MeteorObservable.call('aggregate', 'customerQuotes', query).subscribe(products => {
      this.productsWithName = products['result']
    })


    MeteorObservable.call('aggregate', 'customers', [{ $match: { _id: this.data['customerId']}}]).subscribe(customer => {
      // console.log(customers['result'][0]);
      this.contractId = customer['result'][0].contractId
      // console.log(this.contractId);
    })
    
    MeteorObservable.call('findOne', 'customerQuotes', {
      _id: this.data['quoteId']
    }).subscribe(quote => {
      let products = quote['products'];
      let quoteStatus = completeStatus;
      if (completeStatus === 'approved') {
        completeStatus = (_.isEqual(this.originalProducts, products)) ? completeStatus : 'revised and ' + completeStatus
      }
      
      let emailData = {};
      let variables = {
        logo: 'https://app.yibas.com/img/Global-White.png',
        customer: this.quote.customer,
        productLine: this.quote.category,
        quoteNotes: this.quote.notes,
        adminNotes: this.quote.adminNotes,
        products: this.productsWithName,
        salesPerson: this.quote.user,
        status: completeStatus,
        statusCapital: completeStatus.charAt(0).toUpperCase() + completeStatus.slice(1),
      }

      emailData['to'] = this.salesPersonEmail;
      emailData['from'] = this.quoteAlertInfo.email.from;
      emailData['bcc'] = this.quoteAlertInfo.email.bcc;
      emailData['subject'] = this.quoteAlertInfo.email.subject + completeStatus.toUpperCase();

      if (quoteStatus === 'approved') {
        for (var i = 0; i < products.length; i++) {

          let query = {
            _id: this.contractId,
            "products._id": products[i].productId
          }
          let update = {
            $set: {
              'products.$.price': products[i].price,
              'products.$.previousPrice': this.rows[i].price,
              'products.$.isSynced': false
            }
          };
          let addToSetUpdate = {
            $addToSet: {
                products: {
                '_id': products[i].productId,
                'price': products[i].price,
                'previousPrice': this.rows[i].price,
                'isSynced': false,
                "createdUserId": Meteor.userId(),
                "createdAt": new Date()
              }
            }
          };
          MeteorObservable.call('update', 'customerContracts', query, update).subscribe(res => {
            if (!res) {
              delete query['products._id']
              MeteorObservable.call('update', 'customerContracts', query, addToSetUpdate).subscribe(res => {})
            }
          })
        }
      }

      MeteorObservable.call('sendEmail', emailData, 'html-completeQuote.html', variables).subscribe(quote => { })
      this.router.navigate(['customers/quotes/']);
      // console.log(variables);
    })
  }

  getRows(rows) {
    this.rows = rows;
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch (action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

}
