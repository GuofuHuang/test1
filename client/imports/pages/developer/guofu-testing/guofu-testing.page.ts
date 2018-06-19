import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import * as moment from "moment";
import {MeteorObservable} from "meteor-rxjs";

import * as funcs from '../../../../../both/functions/common';

@Component({
  selector: 'guofu-testing',
  templateUrl: 'guofu-testing.page.html'
})

export class GuofuTestingPage implements OnInit{
  public form: FormGroup;
  public test: FormGroup;
  public submitted: boolean; // keep track on whether form is submitted

  private message: string;

  dateTimeConfig = {
    locale: moment.locale(),
    firstDayOfWeek: 'su',
    dayBtnFormat: "D",
    minutesInterval: 15,
    format: 'DD MMM YYYY hh:mm A'
  };

  config = {
    isReactiveUpdate: false
  };


  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  constructor(
    private router?: Router,
    private _service?: NotificationsService,
    private _fb?: FormBuilder
  ) {

  }


  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  private html = `<p>Test</p><p>A nother test</p>`;

  ngOnInit() {

    this.form = this._fb.group({
      address: this._fb.group({
        street: ['globalthe source', <any>Validators.required],
        postcode: ['', <any>Validators.required]
      }),
      test: ['']
    });
    this.form.controls['address'].patchValue({street: 'test'});

    let date = moment(new Date('14 Oct 2017 3:15 PM')).add(1, 'hours').format(this.dateTimeConfig.format);
    this.test = this._fb.group({selectedDate: [date]});

  }

  onBlur(name) {

  }

  submit(value, valid) {
    this.submitted = true;
  }

  updateCustomerContractsProductsPrice() {
    const json = this.getJsonObj();

    MeteorObservable.call('customerContracts.updateProductsPrice').subscribe((res:any) => {
      res.forEach(async(contract) => {
        let needUpdate = false;
        contract.products.forEach(product => {
          const tempProduct = Object.assign({}, product);
          tempProduct.contractId = contract._id;
          let newProduct:any = this.getUpdatedProduct(tempProduct, json);
          if (!funcs.isEmptyObject(newProduct)) {
            needUpdate = true;
            product.price = newProduct.price;
            product.previousPrice = newProduct.previousPrice;
            product.isSynced = false;
          }
          delete product['categoryName'];
          delete product['productName'];
          delete product['categoryId'];
        });
        if (needUpdate) {

          let query = {_id: contract._id};
          let update = {
            $set: {
              products: contract.products
            }
          };
          let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'customerContracts', query, update));
          // MeteorObservable.call('update', 'Copy_of_customerContracts', {_id: contract._id},
          //   {
          //     $set: {
          //       products: contract.products
          //     }
          //   }).subscribe(res => {
          //   console.log('result', res);
          // });
        }
      })
    });
  }

  getUpdatedProduct(product:any, json:any) {
    let index1 = -1;
    let index2 = -1;
    let index3 = -1;
    let targetCase;

    index1 = json.cases.findIndex((_case:any) => {
      if ('value' in _case) {
        if (_case.value.includes(product.contractId)) {
          // find contract id
          return true;
        } else {
          return false;
        }
      }  else {
        return false;
      }
    });

    if (index1 == -1) {
      index1 = 0;
    }
    // get top index

    if ('switch' in json.cases[index1]) {
      index2 = json.cases[index1].switch.cases.findIndex(_case => {
        if ('value' in _case) {
          if (_case.value.includes(product.categoryName)) {
            // find category name
            return true;
          } else {
            return false;
          }
        } else
          return false;
      });
      if (index2 == -1) {
        index2 = 0;
      }

      if ('switch' in json.cases[index1].switch.cases[index2]) {
        index3 = json.cases[index1].switch.cases[index2].switch.cases.findIndex(_case => {
          if ('value' in _case) {
            if (_case.value.includes(product.productName)) {
              // find product name
              return true;
            } else {
              return false;
            }
          } else
            return false;
        });
        if (index3 == -1) {
          index3 = 0;
        }
      }
    }

    if (index3 > -1) {
      targetCase = json.cases[index1].switch.cases[index2].switch.cases[index3];
    } else if (index2 > -1) {
      targetCase = json.cases[index1].switch.cases[index2];
    } else {
      targetCase = json.cases[index1];
    }

    if ('rate' in targetCase) {
      this.setPriceWithRate(product, targetCase);
    } else if ('price' in targetCase) {
      this.setPriceWithPrice(product, targetCase);
    }

    if ('rate' in targetCase || 'price' in targetCase) {
      return {
        price: Number(product.price.toFixed(2)),
        previousPrice: Number(product.previousPrice.toFixed(2)),
        isSynced: false
      }
    } else {
      return {};
    }
  }


  setPriceWithRate(product, _case) {
    let newPrice = product.price * _case.rate;
    product.previousPrice = product.price;
    product.price = newPrice;
  }

  setPriceWithPrice(product, _case) {
    let newPrice = _case.price;
    product.previousPrice = product.price;
    product.price = newPrice;
  }


  getPermission() {
    this._service.success(

      'Some Title',
      'Some Content',
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    )
  }

  getJsonObj() {
    let json = {
      _id: "s1",
      cases: [
        {
          _id: "s1_default",
          switch: {
            _id: 's1_default_s1',
            cases: [
              {
                _id: "s1_default_s1_default",
                rate: 1.049
              },
              {
                _id: "s1_default_s1c1",
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"]
              }
            ]
          }
        },
        {
          _id: "s1c1",
          value: [
            '2sSV6jxDQomDokzxE',
            'UmKQUM2SrN4OnFOwk',
            'FhFzqNqyaS6wrESjo',
            'vWNv8Tx7w8rFHHWe3',
            'xLrTiazPETds4xtN6',
            'uxbqNZzrCScmNkWoI']
        },
        {
          _id: "s1c2",
          value: [
            'q7eWGm6mJHFSsrA4w'
          ],
          switch: {
            _id: 's1c2s1',
            cases: [
              {
                _id: "s1c2s1_default",
                rate: 1.038
              },
              {
                _id: 's1c2s1c1',
                value: ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200']
              },
            ]
          }
        },
        {
          _id: "s1c3",
          value: [
            'PTELsGb0Vnwy2Bsee'
          ],
          switch: {
            _id: 's1c3s1',
            cases: [
              {
                _id: "s1c3s1_default",
                rate: 1.049
              },
              {
                _id: 's1c3s1c1',
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200", "9500"]
              },
            ]
          }
        },
        {
          _id: "s1c4",
          value: [
            '1ggDZ1pM60Hl61ciU'
          ],
          switch: {
            _id: 's1c4s1',
            cases: [
              {
                _id: "s1c4s1_default",
                switch: {
                  _id: "s1c4s1_default_s1",
                  cases: [
                    {
                      _id: "s1c4s1c1_default_s1_default",
                      rate: 1.049
                    },
                    {
                      _id: "s1c4s1c1_default_s1c1",
                      value: ["WN-7J", "5004-1/2"]
                    },
                  ]
                }
              },
              {
                _id: 's1c4s1c1',
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"]
              },

            ]
          }
        },
        {
          _id: "s1c5",
          value: [
            'MDWGb5tUsReoWLTcY'
          ],
          switch: {
            _id: 's1c5s1',
            cases: [
              {
                _id: "s1c5s1_default",
                rate: 1.049
              },
              {
                _id: 's1c5s1c1',
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200", "7100", "7500", "7600"],
                switch: {
                  _id: 's1c5s1c1s1',
                  cases: [
                    {
                      _id: 's1c5s1c1s1_default'
                    },
                    {
                      _id: 's1c5s1c1s1c1',
                      value: ['TES5'],
                      price: 26.00
                    },
                  ]
                }
              },
            ]
          }
        },
        {
          _id: "s1c6",
          value: [
            'I7ChzlW7RfGBMFtY1'
          ],
          switch: {
            _id: 's1c6s1',
            cases: [
              {
                _id: "s1c6s1_default",
                rate: 1.049
              },
              {
                _id: 's1c6s1c1',
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"],
                switch: {
                  _id: 's1c6s1c1s1',
                  cases: [
                    {
                      _id: 's1c6s1c1s1_default',
                    },
                    {
                      _id: 's1c6s1c1s1c1',
                      value: ['TES5'],
                      rate: 1.049
                    }
                  ]
                }
              },
            ]
          }
        },
        {
          _id: "s1c7",
          value: [
            'TeBlAiatmvEBQqcKw'
          ],
          switch: {
            _id: 's1c7s1',
            cases: [
              {
                _id: 's1c7s1_default',
                switch: {
                  _id: 's1c7s1_default_s1',
                  cases: [
                    {
                      _id: 's1c7s1_default_s1_default',
                      rate: 1.049
                    },
                    {
                      _id: 's1c7s1_default_s1c1',
                      value: ['8073'],
                      price: 6.40
                    },
                    {
                      _id: 's1c7s1_default_s1c2',
                      value: ['8077'],
                      price: 8.65
                    },
                  ]
                }
              },
              {
                _id: 's1c7s1c1',
                value: ["1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"]
              },

            ]
          }
        },
        {
          _id: "s1c8",
          value: [
            'fKeWFuZVOxeiD7bvX'
          ],
          switch: {
            _id: 's1c8s1',
            cases: [
              {
                _id: 's1c8s1_default',
                rate: 1.049
              },
              {
                _id: 's1c8s1c1',
                value: [
                  "1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"
                ],
                switch: {
                  _id: "s1c8s1c1s1",
                  cases: [
                    {
                      _id: "s1c8s1c1s1_default",
                    },
                    {
                      _id: "s1c8s1c1s1c1",
                      value: ["TES5"],
                      rate: 1.049
                    }
                  ]
                }
              },
            ]
          }
        },
        {
          _id: "s1c9",
          value: [
            '6BjFGzE1GaGbW4dmi'
          ],
          switch: {
            _id: 's1c9s1',
            cases: [
              {
                _id: 's1c9s1_default',
                rate: 1.049
              },
              {
                _id: 's1c9s1c1',
                value: [
                  "1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"
                ],
                switch: {
                  _id: "s1c9s1c1s1",
                  cases: [
                    {
                      _id: "s1c9s1c1s1_default",
                    },
                    {
                      _id: "s1c9s1c1s1c1",
                      value: ["DT48-175"],
                      price: 10.60
                    }
                  ]
                }
              },
            ]
          }
        },
        {
          _id: "s1c10",
          value: [
            'uUlL5zqYN0iUtUjZ0'
          ],
          switch: {
            _id: 's1c10s1',
            cases: [
              {
                _id: 's1c10s1_default',
                rate: 1.049
              },
              {
                _id: 's1c10s1c1',
                value: [
                  "1800", "1900", "1950", "3100", "3200", "3900", "6100", "6200"
                ],
                switch: {
                  _id: "s1c10s1c1s1",
                  cases: [
                    {
                      _id: "s1c10s1c1s1_default",
                    },
                    {
                      _id: "s1c10s1c1s1c1",
                      value: ["DT48-175"],
                      price: 10.60
                    }
                  ]
                }
              },
            ]
          }
        },
      ]
    };

    return json;
  }
}
