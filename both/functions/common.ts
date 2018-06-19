/*
* exported functions with _ before each function name must return something
* */
import {MeteorObservable} from "meteor-rxjs";
import * as moment from 'moment-timezone';
import {SystemTenants} from "../collections/systemTenants.collection";
import { Logo } from './image';
import * as _ from "underscore";

export function generateRegexWithKeywords(fields: any, keywords) {
  let obj = {
    $and: []
  };

  let arr = keywords.split(" ");
  arr.forEach(keyword => {
    if (keyword.trim() !== '') {

      let temp = {
        $or: []
      };

      // find and aggregate
      fields.forEach((field) => {
        temp.$or.push({
          [field]: {$regex: keyword.trim(), $options: 'i'}
        })
      });

      obj.$and.push(temp);
    }
  });

  return obj;
}

export function isEmptyObject(obj) {
  if (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  } else {
    return true;
  }
}

export function isEmptyString(str) {
  return (!str || 0 === str.length);
}


export function parseAll(args, objLocal) {
  // args[0].value[9]._$match._$and[0]._$or[0]._$regex;
  return args.map((arg) => {
    arg = parseDollar(arg);
    arg = parseDot(arg);
    arg = parseParams(arg, objLocal);
    return arg.value;
  });
}

export function parseDollar(obj:any) {
  obj = JSON.stringify(obj);
  obj = obj.replace(/_\$/g, '$');
  obj = JSON.parse(obj);
  return obj;
}

export function parseDot(obj:any) {
  obj = JSON.stringify(obj);
  obj = obj.replace(/_DOT_/g, '.');
  obj = JSON.parse(obj);
  return obj;
}

export function testParseParams(obj:any, objLocal) {
  let copiedObj = Object.assign({}, obj);
  obj = JSON.stringify(obj);

  if ('params' in copiedObj) {

    copiedObj.params.forEach((param, index) => {
      if(param.indexOf('.') !== -1) {
        let arrParam = param.split('.');
        let copiedObjLocal = Object.assign({}, objLocal);
        arrParam.forEach((param, i) => {
          if (!copiedObjLocal) {
            copiedObjLocal = [{}];
          } else {
            if (copiedObjLocal[param] || copiedObjLocal[param] == 0) {
              copiedObjLocal = copiedObjLocal[param];
            } else {
              copiedObjLocal = '';
            }
          }

          if (i == arrParam.length-1) {
            obj = obj.replace(new RegExp('_VAR_' + index, 'g'), copiedObjLocal);
          }
        })
      } else {
        if (['boolean', 'number'].indexOf(typeof objLocal[param]) >= 0) {
          // if it is a boolean or number
          obj = obj.replace(new RegExp('"_VAR_' + index + '"', 'g'), objLocal[param]);
        } else {
          obj = obj.replace(new RegExp('_VAR_' + index, 'g'), objLocal[param]);
        }
      }
    });
  }

  return JSON.parse(obj);
}

export function parseParams(obj:any, objLocal:any={}) {
  if (obj.name === 'options') {
    if ('sort' in objLocal) {
      obj.value.sort = objLocal.sort;
    }
  }
  let copiedObj = Object.assign({}, obj);
  obj = JSON.stringify(obj);

  if ('params' in copiedObj) {
    copiedObj.params.forEach((param, index) => {
      if(param.indexOf('.') !== -1) {
        let arrParam = param.split('.');
        let copiedObjLocal = Object.assign({}, objLocal);
        arrParam.forEach((param, i) => {
          if (!copiedObjLocal) {
            copiedObjLocal = [{}];
          } else {
            if (copiedObjLocal[param] || copiedObjLocal[param] == 0) {
              copiedObjLocal = copiedObjLocal[param];
            } else {
              copiedObjLocal = '';
            }
          }

          if (i == arrParam.length-1) {
            if (typeof copiedObjLocal != 'string') {
              copiedObjLocal = JSON.stringify(copiedObjLocal);
              obj = obj.replace(new RegExp('"_VAR_' + index + '"', 'g'), copiedObjLocal);
            } else {
              obj = obj.replace(new RegExp('_VAR_' + index, 'g'), copiedObjLocal);
            }
          }
        })
      } else {
        if (['boolean', 'number'].indexOf(typeof objLocal[param]) >= 0) {
          // if it is a boolean or number
          obj = obj.replace(new RegExp('"_VAR_' + index + '"', 'g'), objLocal[param]);
        } else {
          obj = obj.replace(new RegExp('_VAR_' + index, 'g'), objLocal[param]);
        }
      }
    });
  }

  return JSON.parse(obj);
}

export function generatePipeline(condition, and) {
  switch (condition.method) {
    case '<>': // between
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        condition.value = condition.value.split(',');
        and.push({
          [condition.field]: {
            $gte: new Date(condition.value[0]),
            $lt: new Date(condition.value[1])
          }
        });
      } else{
        condition.value = condition.value.split(',');

        and.push({
          [condition.field]: {
            $gte: condition.value[0],
            $lt: condition.value[1]
          }
        });
      }
      return;
    case "$gte":
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        condition.value = new Date(condition.value)
      }
      and.push({
        [condition.field]: {
          $gte: condition.value
        }
      });
      return;
    case "$lt":
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        condition.value = new Date(condition.value);
      }
      and.push({
        [condition.field]: {
          $lt: condition.value
        }
      });
      return;
    case 'like':
      and.push({
        [condition.field]: {
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    case "$or":
      and.push({
        [condition.field]:{$in: [[...condition.value]]}
      });
      return;
    case '$eq':
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        let equalDate =  new Date(condition.value);
        and.push({
          [condition.field]: {
            $gte: new Date(condition.value),
          }
        });
        equalDate.setDate(equalDate.getDate() + 1);
        and.push({
          [condition.field]: {
            $lt: equalDate,
          }
        });
      } else {
        and.push({
          [condition.field]:{$eq: condition.value}
        });
      }

      return;
    case '$ne':
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        let equalDate =  new Date(condition.value);
        let plus = new Date(condition.value);
        plus.setDate(plus.getDate() + 1);
        let not = {};
        and.push({
          $or: [
            {
              [condition.field]: {
                $lt: equalDate
              }
            },
            {
              [condition.field]: {
                $gt: plus,
              }
            }
          ]
        });
      } else {
        and.push({
          [condition.field]:{$ne: condition.value}
        });
      }

      return;
    case '$not':
      and.push({
        [condition.field]:{$not: new RegExp(condition.value, 'i')}
      });
      return;
    case "$regex":
      and.push({
        [condition.field]:{
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    default:
      return;
  }
}

export function asyncGetLookupId(lookupName) {
  // make subscriptions to the lookup
  return new Promise(resolve => {
    if (Session.get('parentTenantId')) {
      let query = {
        name: lookupName,
        parentTenantId: Session.get('parentTenantId')
      };

      MeteorObservable.call('findOne', 'systemLookups', query).subscribe((systemLookup:any) => {
        if (systemLookup) {
          if (Meteor.user() && systemLookup) {
            const user:any = Meteor.user();
            let lookupId = getLookupIdFromUser(systemLookup);
            if (lookupId) {
              resolve(lookupId);
            } else {
              if ('tenants' in user) {
                let tenantIndex = user.tenants.findIndex((tenant: any) => tenant._id == Session.get('tenantId'));
                let groupId = '';
                if ('defaultGroupId' in user.tenants[tenantIndex] && user.tenants[tenantIndex] != '') {
                  groupId = user.tenants[tenantIndex].defaultGroupId;
                  let index = user.tenants[tenantIndex].groups.findIndex((res) => res == groupId);
                  if (index == -1) {
                    groupId = '';
                  }
                } else {
                  groupId = user.tenants[tenantIndex].groups[0];
                }

                MeteorObservable.call('findOne', 'userGroups', {_id: groupId}).subscribe((res: any) => {
                  let group = res;
                  if ('lookups' in group) {
                    group.lookups.findIndex(lookup => {
                      if (lookup.from == systemLookup._id) {
                        lookupId = lookup.to;
                        return true;
                      }
                    });
                    if (lookupId) {
                      resolve(lookupId);
                    } else {
                      resolve(systemLookup._id);
                    }
                  } else {
                    resolve(systemLookup._id);
                  }
                });
              } else {
                resolve(systemLookup._id);
              }
            }
          }
        }
      });
    }
  });
}


export function getLookupIdFromUser(systemLookup) {
  let lookupId= '';
  const user:any = Meteor.user();
  if ('tenants' in user) {
    let index = user.tenants.findIndex((tenant:any) => tenant._id == Session.get('tenantId'));
    if ('lookups' in user.tenants[index]) {
      user.tenants[index].lookups.findIndex(lookup => {
        if (lookup.from == systemLookup._id) {
          lookupId = lookup.to;
          return true;
        }
      });
    }
  }
  return lookupId;
}

export function getParameterByName(name, url?) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function callbackToPromise(method, ...args) {
  return new Promise(function(resolve, reject) {
    return method.subscribe((res, err) => {
      return err ? reject(err) : resolve(res);
    });
  });
}

export function toTimeZone(time, zone) {
  // if (!format) {
  //   format = 'YYYY/MM/DD HH:mm:ss ZZ';
  // }
  return moment(time).tz(zone);
}

export function setObjectValue(object, path, value) {
  let a = path.split('.');
  let o = object;
  for (let i = 0; i < a.length - 1; i++) {
    let n = a[i];
    if (n in o) {
      o = o[n];
    } else {
      o[n] = {};
      o = o[n];
    }
  }
  o[a[a.length - 1]] = value;
}

export function getObjectValue(object, path) {
  let o = object;
  path = path.replace(/\[(\w+)\]/g, '.$1');
  path = path.replace(/^\./, '');
  let a = path.split('.');
  while (a.length) {
    let n = a.shift();
    if (n in o) {
      o = o[n];
    } else {
      return;
    }
  }
  return o;
}



export function getTenantBySubdomain(subdomain) {
  return SystemTenants.collection.find({subdomain: subdomain});
}

export function getSubdomain() {
  return window.location.host.split('.')[0];
}

export function runAggregate(collection, pipeline) {
  return callbackToPromise(MeteorObservable.call('aggregate', collection, pipeline));
}

export function getUser(userId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'users', {_id: userId}, {fields: {services: 0}}));
}

export function getTenantById(tenantId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemTenants', {_id: tenantId}));
}

export function getCategorySales(year, categoryId) {
  return callbackToPromise(MeteorObservable.call('getCategorySales', year, categoryId));
}

export function getCustomerCategorySales(year, customerId, categoryId) {
  return callbackToPromise(MeteorObservable.call('getCustomerCategorySales', year, customerId, categoryId));
}

export function update(collectionName, query, update) {
  return callbackToPromise(MeteorObservable.call('update', collectionName, query, update));
}

export function findOne(collectionName, query, options?) {
  return callbackToPromise(MeteorObservable.call('findOne', collectionName, query, options));
}
export function find(collectionName, query, options?) {
  return callbackToPromise(MeteorObservable.call('find', collectionName, query, options));
}

export function getSystemLog() {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', {sessionId: localStorage.getItem('sessionId')}, {fields: {sessionId: 1, createdUserId: 1}}));
}

export function generateLogFromAction(action) {
  let logMessage = 'Update ' + action.field + ' to ' + action.value + ' from ' + action.previousValue;
  action.log = logMessage;
  return action;
}

export function log(logId, action) {
  let query = {
    _id: logId
  };
  let update = {
    $push: {
      actions: action
    }
  };
  return callbackToPromise(MeteorObservable.call('update', 'systemLogs', query, update));
}

export function setConnectionLandTime(connectionId, pathname) {
  return callbackToPromise(MeteorObservable.call('setConnectionLandTime', connectionId, pathname));

}

export function getPageConnections(pathname) {
  return callbackToPromise(MeteorObservable.call('getPageConnections', pathname));
}

export function getCategoryById(categoryId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'categories', {_id: categoryId}));
}
export function getCustomerById(customerId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'customers', {_id: customerId}));
}

// export function getUrlParams(url) {
//   let type = typeof url;
//   let obj = {};
//   if (type == 'string') {
//     let urlArr = url.split('.');
//     Object.assign(obj, {[urlArr[0]]: urlArr[1]});
//   } else {
//     url.forEach(param => {
//       let urlArr = param.split('.');
//       Object.assign(obj, {[urlArr[0]]: urlArr[1]});
//     })
//   }
//   return obj;
// }

export function parseUrlParams(params) {
  let url = {};
  Object.keys(params).forEach(key => {
    let keyArr = key.split('.');
    if (keyArr.length > 1) {
      url[keyArr[1]] = params[key];
    } else {
      url[key] = params[key];
    }
  });

  return url;
}


// async functions
export async function isDeveloper(userId, tenantId) {
  const user:any = await getUser(userId);
  if ('tenants' in user) {
    const tenantIndex = user.tenants.findIndex(tenant => {
      if (tenant._id == tenantId) {
        return true;
      }
    });
    if (tenantIndex > -1) {
      let mapResult = await Promise.all(user.tenants[tenantIndex].groups.map(async(groupId) => {
        if (groupId) {
          let group:any = await callbackToPromise(MeteorObservable.call('findOne', 'userGroups', {_id: groupId}))
          if (group && group.name == 'Developer') {
            return true;
          }
        }
      }));
      let index = mapResult.findIndex(res => {
        if (res == true) {
          return true;
        }
      });
      if (index > -1) {
        return true;
      }
    }
  }
  return false;
}

export function getContractIdByCustomerId(customerId) {
  return callbackToPromise(MeteorObservable.call('getContractId', customerId));
}

export function getProductById(productId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'products', {_id: productId}));
}

export function getContractProductByProductId(contractId, productId) {
  return callbackToPromise(MeteorObservable.call('getContractProductByProductId', contractId, productId));

}

export function getProductByQuery(query) {
  return callbackToPromise(MeteorObservable.call('find', 'products', query));
}

export function getContractById(contractId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'customerContracts', {_id: contractId}));
}

export function getContractByQuery(query) {
  return callbackToPromise(MeteorObservable.call('find', 'customerContracts', query));
}
export function getContractCategory(contractId, categoryId) {
  return callbackToPromise(MeteorObservable.call('getContractCategory', contractId, categoryId));
}
export function checkNullFromObject(obj, paths) {
  let pathArr = paths.split('.');
  let newObj = {};
  pathArr.forEach(path => {
    if (path in obj) {
      obj = obj[path];
    } else {
      return true
    }
  })
  return false;
}

export function addUserActivity(doc) {
  // return callbackToPromise(MeteorObservable.call('insert', 'userActivities', doc));
  return false;
}

export function checkMobile() {
  let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false;
  return mobile;
}

export function reportPdf(pdfContent) {
  generateTableBody(pdfContent)
  let dd = {
    pageOrientation: 'landscape',
    footer: function (currentPage, pageCount) {
      return {
        margin: [20, 10, 20, 0],
        fontSize: 10,
        columns: [
          {
            text: currentPage.toString() + ' of ' + pageCount
          },
          {
            text: moment().format("MM/DD/YYYY h:mma"),
            alignment: 'right',
          }
        ]
      }
    },
    content: [
      {
        style: 'tableExample',
        table: {
          headerRows: 2,
          widths: generateColumnWidths(pdfContent),
          body: generateTableBody(pdfContent),
        }
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: false,
        margin: [0, 0, 0, 10],
        color: 'black',
        // alignment: 'center'
      },
      subheader: {
        alignment: 'center',
        fontSize: 14,
        bold: false,
        // margin: [40],
        color: 'white',
        fillColor: '#c25113'
      },
      tableExample: {
        margin: [0, 5, 0, 15],
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black',
        alignment: 'center',
        fillColor: '#dedede'
      },
      branding: {
        // width: '*',
        fillColor: '#c25113',
        background: '#c25113',
        color: 'white',
        alignment: 'left'
      }
    },
  }
  return dd;
}

export function pdfContentArray(pdfObj) {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [33, 100, 40, 40],
    background: {
      image: Logo,
      width: 200,
      margin: [30, 33, 30, 0]
    },
    header: {
      table: {
        headerRows: 1,
        widths: ['*'],
        body: [
          [{ text: 'Global The Source', style: 'branding', border: [false, false, false, false], alignment: 'right' }]

        ]
      },
      layout: {
        hLineWidth: function (i, node) {
          return (i === 0 || i === node.table.body.length) ? 0 : 0;
        },
        vLineWidth: function (i, node) {
          return (i === 0 || i === node.table.widths.length) ? 0 : 0;
        },
        paddingLeft: function (i, node) { return 492.7; },
        paddingTop: function (i, node) { return 3; },
        paddingBottom: function (i, node) { return 3; }
      }
    },
    footer: function (currentPage, pageCount) {
      return [
        {
          columns: [
            [
              {
                width: '*',
                text: currentPage.toString() + ' of ' + pageCount,
              },
              // {
              //   text: `Printed by joe`,
              // }
            ],
            [
              {
                width: '*',
                alignment: 'right',
                text: `Price Sheet for: ` + pdfObj.customer
              },
              // {
              //   width: '*',
              //   alignment: 'right',
              //   text: `Created on: - End Date: Dec 31 2018`
              // }
            ],

          ],
          margin: [20, 5, 20, 0],
          fontSize: 10
        }
      ]
    },
    content: [
      { text: 'Customer Price Sheet', style: 'header' },
      {
        columns: [
          {
            // auto-sized columns have their widths based on their content
            width: 'auto',
            text: pdfObj.customer,
            bold: true,
            fontSize: 15
          },
          {
            // star-sized columns fill the remaining space
            width: '*',
            alignment: 'right',
            text: `End Date: Dec 31, 2018`
            // text: `End Date: ` + moment(Session.get('endContractDate')).format("MMM DD, YYYY")
          }
        ]
      },
      _.sortBy(pdfObj.content, '_id').map((table) => {
        return getTables(table)
      }),

    ],

    // Styles dictionary
    styles: {
      header: {
        fontSize: 18,
        bold: false,
        margin: [0, 0, 0, 10],
        color: 'black',
        // alignment: 'center'
      },
      subheader: {
        alignment: 'center',
        fontSize: 14,
        bold: false,
        // margin: [40],
        color: 'white',
        fillColor: '#c25113'
      },
      tableExample: {
        margin: [0, 5, 0, 15],
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black',
        alignment: 'center',
        fillColor: '#dedede'
      },
      branding: {
        // width: '*',
        fillColor: '#c25113',
        background: '#c25113',
        color: 'white',
        alignment: 'left'
      }
    },
    defaultStyle: {
      alignment: 'justify'
    }
  };
  return docDefinition;
}

function generateColumnWidths(contents) {
  let columns = contents.lookup.dataTable.columns;
  let columnArr = [];
  columns.forEach(element => {
    if (element.hidden !== true) {
      let width = element.reportColumnWidth ? element.reportColumnWidth : '*';
      columnArr.push(width);
    }
  });
  return columnArr;
}

function generateTableBody(contents) {
  let body = []
  let title = contents.lookup.dataTable.options.reportTitle;
  let columns = contents.lookup.dataTable.columns;
  let results = contents.result;
  let totals = contents.totals;
  let date = (contents.date) ? ' (' + moment(contents.date).format("MM/DD/YYYY") + ')': ''

  // let columnHeaders = [{ text: title, style: 'header', alignment: 'left', border: [false, false, false, false] }, {}, {}, {}, {}, {}, {}, {}, {}, date]
  let reportTitle = [];
  let columnTitles = [];
  let rows = [];
  let rowSpecificInfo = [];
  let hiddenColumns = [];
  columns.forEach(element => {
    if (element.hidden !== true) {
      let alignment = element.reportAlignment ? element.reportAlignment : 'center';
      let reportTotal = element.reportTotalName ? element.reportTotalName : null;
      reportTitle.push({});
      columnTitles.push({ text: element.reportColumnName, fontSize: 10, alignment: alignment, border: [false, false, false, true] });
      rowSpecificInfo.push({ prop: element.prop, alignment: alignment, total: reportTotal})
    } else {
      hiddenColumns.push(element.prop)
    }
  });
  reportTitle.splice(0, 1, { text: title + date, style: 'header', colSpan: reportTitle.length, alignment: 'left', border: [false, false, false, false] });
  body.push(reportTitle, columnTitles);

  results.forEach(element => {
    let row = [];
    rowSpecificInfo.forEach(rowInfo => {
      let text = element[rowInfo.prop];
      if (!_.contains(hiddenColumns, rowInfo.prop)) {
        if (element[rowInfo.prop] instanceof Date) {
          text = moment(element[rowInfo.prop]).format("MM/DD/YYYY")
        } else {
          if (element[rowInfo.prop] !== null && element[rowInfo.prop] !== undefined) {
            text = (typeof element[rowInfo.prop] == 'number') ? element[rowInfo.prop].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : element[rowInfo.prop];
          } else {
            text = "";
          }
        }

        row.push({ text: text, alignment: rowInfo.alignment, fontSize: 9, border: [false, false, false, false] })
      }
    });
    body.push(row);
  });

  if (totals) {
    let rowTotal = [];
    rowSpecificInfo.forEach(rowInfo => {
      if (rowInfo.total) {
        rowTotal.push({ text: totals[rowInfo.total].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 9, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
      } else {
        rowTotal.push({ text: '', alignment: rowInfo.alignment, bold: true, fontSize: 9, margin: [0, 0, 0, 0], border: [false, false, false, false] })
      }
    });
    body.push(rowTotal);
  }

  return body;
}

function getTables(table) {
  let columnHeaders;
  let colArr = [];
  let rowArr = [];

  // columnHeaders = Object.keys(table['row'][0]);

  columnHeaders = ['Customer Part No.', 'Global Part No.', 'Descripton', 'Price']

  columnHeaders.map((column, index) => {
    if (index !== 3) {
      colArr.push({ text: column, style: 'tableHeader', alignment: 'left' })
    } else {
      colArr.push({ text: column, style: 'tableHeader', alignment: 'right' })
    }
  })

  let tableBody = table.row;
  tableBody.map((row) => {
    let eachRowArr = [];
    let rowValue = _.values(row)
    rowValue.map((Row, index) => {
      if (index !== 3) {
        eachRowArr.push({ text: Row, alignment: 'left', })
      } else {
        eachRowArr.push({ text: "$" + Row.toFixed(2), alignment: 'right',})
      }
    });
    rowArr.push(eachRowArr)
  })

  rowArr.unshift(colArr)
  rowArr.unshift([{ text: table.categoryDescription, style: 'subheader', colSpan: 4, alignment: 'center' }, {}, {}, {}])
  let tableContent = {
    table: {
      headerRows: 2,
      widths: [110, 100, '*', 60],
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      body: rowArr
    },
    layout: {
      hLineWidth: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 0 : 1;
      },
      vLineWidth: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 0 : 0;
      },
      hLineColor: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 'white' : '#ececec';
      },
      vLineColor: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 'white' : 'white';
      },
      paddingTop: function (i, node) { return 5; },
      paddingBottom: function (i, node) { return 5; }
    }
  }
  return tableContent
}

export function borrowingBaseReport(content) {
  let today = moment().format("MM/DD/YYYY");
  let dd = {
    content: [
      {
        table: {
          body: [
            [{ text: 'Vladmir, Ltd', border: [false, false, false, false] }, { text: '2/27/2018', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Total Accounts Receivable as of', bold: true, border: [false, false, false, false] }, { text: today, border: [false, false, false, true] }, { text: '', alignment: 'left', border: [false, false, false, true] }, { text: '$' + formatNumberForPdf(content.totalAR), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: '90 days from total invoice date', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: formatNumberForPdf(content.invoiceTotal90Day), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'TOTAL 90 Days from invoice date', bold: true, style: 'indent', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.invoiceTotal90Day), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Eligible Receivables', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, true] }, { text: '$' + formatNumberForPdf(content.eligibleReceivable), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Loan Value of Accounts', bold: true, border: [false, false, false, false] }, { text: '80%', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.loanValueAccounts), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Inventory as of', bold: true, border: [false, false, false, false] }, { text: today, border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: formatNumberForPdf(content.totalInventory), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Eligible Inventory', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', border: [false, false, false, true] }, { text: formatNumberForPdf(content.totalInventory), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Loan Value of Accounts', bold: true, border: [false, false, false, false] }, { text: '60%', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.loanValueInventory), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Maximum Loan Amount', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.maxLoanAmmount), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Less 2nd', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: '-', alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Total Line Outstanding', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.totalLineOutstanding), alignment: 'right', border: [false, false, false, false] }, { text: '(GL CASH ACCT LESS LOAN BAL)', fontSize: 8, border: [false, false, false, false] }],
            [{ text: 'Amount Available', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.amountAvailable), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
          ]
        },
      },
      {
        table: {
          body: [
            [{ text: 'The Borrower\'s computation of the following financial covenants contained the Loan Agreement are as follows:', border: [false, false, false, false] }],
          ]
        },
      },
      {
        table: {
          widths: [80, 140, 140, 'auto', 'auto', 'auto'],

          body: [
            [{ text: '1)', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: ['Maintain a Current Ratio in excess of ', { text: '1.25', decoration: 'underline' }, ' to 1.00'], fillColor: '#FFFF00', colSpan: 2, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }],
            [{ text: '', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: 'Current Assets', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: [{ text: '$' + formatNumberForPdf(content.currentAssets), decoration: 'underline' }, ' / Current Liabilities'], fillColor: '#FFFF00', style: 'right', border: [false, false, false, false] }, { text: '$' + formatNumberForPdf(content.totalLiabilites), fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }, { text: '=', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: content.currentAssestsRatio, fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }],
          ]
        },
      },
      '\n',
      {
        table: {
          widths: [80, 140, 140, 'auto', 'auto', 'auto'],

          body: [

            [{ text: '2)', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: ['Maintain a ratio of Debt to Tangible Net Worth not in excess of ', { text: '2.75' }, ' to 1.00'], fillColor: '#FFFF00', colSpan: 2, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }],
            [{ text: '', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: 'Total Liabilities', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: [{ text: '$' + formatNumberForPdf(content.totalLiabilites), decoration: 'underline' }, ' / Tang. Net Worth'], fillColor: '#FFFF00', style: 'right', border: [false, false, false, false] }, { text: '$' + formatNumberForPdf(content.tangNetWorth), fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }, { text: '=', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: content.totalLiabilitesRatio, fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }],
          ]
        },
      },
      '\n',
      { text: 'Defintions:', style: 'defintions', decoration: 'underline', },
      { style: 'defintions', text: [{ text: 'Total Liabilities: ', bold: true }, { text: 'Total Liabilities ' }, { text: 'less', italics: true }, { text: ' Subordinated Debt' }] },
      { style: 'defintions', text: [{ text: 'Tangible Net Worth: ', bold: true }, { text: 'Total Assets ' }, { text: 'less', italics: true }, { text: 'All Intangible Assets less Total Liabilities' }, { text: 'plus', italics: true }, { text: ' Subordinated Debt' }] },
      '\n',
      { style: 'defintions', text: 'The ratios will be based on the operating company financial statements only (not the consolidated statement).', italics: true, bold: true }
    ],
    styles: {
      indent: {
        margin: [10, 0, 0, 0]
      },
      defintions: {
        margin: [140, 0, 0, 0],
        fontSize: 6
      },
    },
    defaultStyle: {
      fontSize: 8,
    }
  }
  return dd;
}

function formatNumberForPdf(number) {
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function addStringToArray(str, array) {

}

export function _addObjectToArray(obj, key, array) {
  const newArray = array.slice();
  let index = array.findIndex(elem => {
    if (elem[key] === obj[key]) {
      return true;
    }
  });
  if (index == -1) {
    newArray.push(obj);
  }
  return newArray;
}

export function _removeParamFromObject(key, params) {
  delete params[key];

}

export function _isObjectChanged(newObj, oldObj, keys) {
  let isChanged = false;
  keys.forEach(key => {
    if (oldObj[key] != newObj[key]) {
      isChanged = true;
    }
  });
  return isChanged;
}

export function _isObjectChangedAll(newObj, oldObj) {
  let isChanged = false;
  let newKeys = Object.keys(newObj);
  let oldKeys = Object.keys(oldObj);
  let allKeys = new Set();
  newKeys.forEach(key => {
    allKeys.add(key);
  })
  oldKeys.forEach(key => {
    allKeys.add(key);
  });

  allKeys.forEach(key => {
    if (oldObj[key] != newObj[key]) {
      isChanged = true;
    }
  });
  return isChanged;
}

export function sortArrayByKey(array, key) {
  const valueArr = array.map(ele => {
    return ele[key];
  });
  valueArr.sort();
}

export function consoleLog(message) {
  MeteorObservable.call('consoleLog', message).subscribe();
}

export function getModule(moduleName) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemModules', {name: moduleName}));
}

export function getSystemOption(query) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemOptions', query));
}

export function getPermission(query) {
  return callbackToPromise(MeteorObservable.call('findOne', 'userPermissions', query));
}

export function getAllowedRoutes(query) {
  return callbackToPromise(MeteorObservable.call('getAllowedRoutes', query));
}

export function checkIfUserCanAccessThisUrl(url) {
  return callbackToPromise(MeteorObservable.call('checkIfUserCanAccessThisUrl', url));
}

export function getTotalSales(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete"
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: "$lineItems.total"
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getTotalMonthSales(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete"
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "_id",
      lineItemsTotal: {
        $sum: "$lineItems.total"
      },
    }
  }, {
    $group: {
      _id: null,
      total: {
        $sum: "$lineItemsTotal"
      },
    }
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getTotalCost(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete"
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: { $multiply: ["$lineItems.cost", "$lineItems.qtyShipped"] }
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getTotalMonthCost(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete"
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: { $multiply: ["$lineItems.cost", "$lineItems.qtyShipped"] }
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function countInvoices(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete"
    }
  },
    {
      $group: {
        _id: "_id",
        count: { $sum: 1 }
      }
    }];
  return runAggregate('customerInvoices', pipeline);
}

export function projectedFutureSales(dateRange) {
  let pipeline = [
    {
      "$match": {
        "date": {
          "$gte": dateRange.gte,
          "$lte": dateRange.lte,
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "lineItems": 1
      }
    },
    {
      "$unwind": "$lineItems"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "categoryId": "$lineItems.categoryId",
        "total": "$lineItems.total"
      }
    },
    {
      "$group": {
        "_id": "$categoryId",
        "total": {
          "$sum": "$total"
        }
      }
    },

    {
      "$lookup": {
        "from": "categories",
        "localField": "_id",
        "foreignField": "_id",
        "as": "categories"
      }
    },
    {
      "$unwind": "$categories"
    },
    {
      "$project": {
        "_id": 1,
        "total": 1,
        "ledgerId": "$categories.inventoryLedgerAccountId",
        "category": "$categories.category"
      }
    }, {
      "$lookup": {
        "from": "ledgerAccounts",
        "localField": "ledgerId",
        "foreignField": "_id",
        "as": "ledgerAccount"
      }
    },
    {
      "$unwind": {
        "path": "$ledgerAccount",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$match": {
        "ledgerAccount.number": {
          "$gte": "1600-00",
          "$lte": "1699-00"
        }
      }
    },
    {
      "$group": {
        "_id": "$ledgerId",
        "total": {
          "$sum": "$total"
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$total"
        }
      }
    },
  ];
  return runAggregate('customerInvoices', pipeline);
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function _sort(arr, sortBy) {
  let newArr = arr.slice();
  newArr.sort((a, b) => {
    const nameA = a[sortBy].toUpperCase(); // ignore upper and lowercase
    const nameB = b[sortBy].toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  return newArr;
}

export function getUpdatedContractProducts(contractId, categoryIds, increasePercentage) {
  return callbackToPromise(MeteorObservable.call('getUpdatedContractProducts', contractId, categoryIds, increasePercentage));
}

export function getContractProductsById(contractId) {
  return callbackToPromise(MeteorObservable.call('getContractProductsById', contractId));
}

