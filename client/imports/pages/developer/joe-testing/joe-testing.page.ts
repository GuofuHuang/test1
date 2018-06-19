import {MeteorObservable} from "meteor-rxjs";
import {NotificationsService} from 'angular2-notifications';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { pdfContentArray, asyncGetLookupId, parseAll } from '../../../../../both/functions/common';
import {Router} from "@angular/router";

@Component({
  selector: 'joe-testing',
  templateUrl: 'joe-testing.page.html'
})

export class JoeTestingPage implements OnInit{

  constructor(
    private router: Router,
    private _service: NotificationsService,

  ) {
    //called first time before the ngOnInit()
    // console.log(pdfFonts);
    // console.log(pdfFonts.pdfMake);
    // pdfMake.vfs = pdfFonts.pdfMake.vfs;

  }
  public subscriptions: Subscription[] = [];
  tableArr: any;
  contractProducts: any;
  products: any;
  objLocal: any = {};

  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    let id = await asyncGetLookupId('joeTesting');
    let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
      let parsed = parseAll(lookup['methods'][0].args, this.objLocal);

    })
    this.subscriptions.push(sub);
    this.tableArr = [
       [{ text: 'Header 1', style: 'tableHeader' }, { text: 'Header 2', style: 'tableHeader' }, { text: 'Header 3', style: 'tableHeader' }, { text: 'Header 4', style: 'tableHeader' }],
      ['Value 1', 'Value 2', 'Value 3', 'Value 4'],
      [{ text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4'],
    ]
    for (var i = 0; i < 20; i++) {
      // console.log(i);
      this.tableArr.push(
        ['First', 'Second', 'Third', 'The last one'],
        ['Value 1', 'Value 2', 'Value 3', 'Value 4'],
        [{ text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4'],
      )
    }
  }

  ngOnInit() {
    // this.init();
  }

  checkContractVsQuote() {

    let query = [
      {
        "$match": {
          "status": "approved",
          "createdAt": { $gte: new Date("2018-01-26T00:00:00.0Z") }
        }
      },
      //   {
      //   "$match": {
      //     "_id": "cbh3aXezXSiyDYNrP",
      //   }
      // },
      {
        "$lookup": {
          "from": "customers",
          "localField": "customerId",
          "foreignField": "_id",
          "as": "customerInfo"
        }
      },
      {
        "$unwind": "$customerInfo"
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          categoryId: 1,
          products: 1,
          isSynced: 1,
          contractId: "$customerInfo.contractId"
        }
      },
      {
        "$lookup": {
          "from": "customerContracts",
          "localField": "contractId",
          "foreignField": "_id",
          "as": "contractInfo"
        }
      },
      {
        "$unwind": "$contractInfo"
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          categoryId: 1,
          products: 1,
          isSynced: 1,
          contractId: 1,
          contractProducts: "$contractInfo.products"
        }
      }, {
        "$unwind": "$products"
      },
      {
        "$lookup": {
          "from": "products",
          "localField": "products.productId",
          "foreignField": "_id",
          "as": "productInfo"
        }
      },
      {
        "$unwind": "$productInfo"
      },
      {
        '$project': {
          _id: 1,
          customerId: 1,
          categoryId: 1,
          products: 1,
          isSynced: 1,
          contractId: 1,
          contractProducts: 1,
          productInfo: 1
        }
      },
      {
        "$group": {
          "_id": "$_id",
          "customerId": {
            "$first": "$customerId"
          },
          "categoryId": {
            "$first": "categoryId"
          },
          "contractId": {
            "$first": "$contractId"
          },
          "products": {
            "$push": { product: "$products", productInfo: "$productInfo" }
          },
          "isSynced": {
            "$first": "$isSynced"
          },
          "contractProducts": {
            "$first": "$contractProducts"
          },

        }
      }
    ]
    MeteorObservable.call('aggregate', 'customerQuotes', query).subscribe(quotes => {
      // console.log(quotes['result']);
      for (var i = 0; i < quotes['result'].length; i++) {
        let quoteArr = []
        this.products = quotes['result'][i]['products'];
        this.contractProducts = quotes['result'][i]['contractProducts'];

        // console.log(this.products);
        // console.log(this.contractProducts);
        for (var j = 0; j < this.products.length; j++) {
          // this.products[j]
          // console.log(this.checkArray(this.products[j].productId, this.contractProducts))
          let check = this.checkArray(this.products[j]['product'].productId, this.contractProducts);
          // console.log(check);
          let price = (check !== undefined) ? check : this.products[j]['productInfo'].price;
          let inContract = (check !== undefined) ? 'Y' : 'N';
          let result = {
            quoteId: quotes['result'][i]._id,
            customerId: quotes['result'][i].customerId,
            contractId: quotes['result'][i].contractId,
            productId: this.products[j]['product'].productId,
            inContract: inContract,
            quotePrice: this.products[j]['product'].price,
            price: price
          }
          if (result.quotePrice !== result.price && result.customerId !== 'qYMJVWDnpUjNbAYlk') {
            quoteArr.push(result);
          }
          // console.log(result);
        }
        if (quoteArr.length > 0) {
          // console.log(quoteArr);
        }
      }
    })

  }

  checkArray(value, array){
    for (var i = 0; i < array.length; i++) {
      if (array[i]._id === value) {
        // console.log('true');
        return array[i].price;
      }
    }
  }

  openPdf() {
    let docDefinition = pdfContentArray(this.tableArr);
    pdfMake.createPdf(docDefinition).open();
  }
}
