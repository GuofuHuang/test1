import { Email } from 'meteor/email';
import { Meteor } from 'meteor/meteor';
let CronJob = Npm.require('cron').CronJob;
import { SystemAlerts } from '../../../both/collections/systemAlerts.collection';
import { SystemOptions } from '../../../both/collections/systemOptions.collection';
import { toTimeZone } from '../../../both/functions/common';
import * as moment from 'moment-timezone';

let result = SystemOptions.collection.findOne({name: "mailOptions"});



if (result) {
  process.env.MAIL_URL = result.value.connectionString;

  let systemAlerts:any = {};

  let jobs:any = [];
  jobs['weeklyCopperAlert'] = weeklyCopperAlert;

  let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
  let oldTimes:string[] = [];
  results.forEach((alert, index) => {
    let newJob;
    oldTimes[index] = alert.schedule;
    newJob = jobs[alert.name](alert, index);
    systemAlerts[alert.name] = newJob;
  });


  Meteor.methods({
    startCron() {
      systemAlerts = {};
      let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
      results.forEach((cronJob, index) => {
        systemAlerts[cronJob.name] = jobs[cronJob.name](cronJob, index);
      })
    },
    stopCron() {
      let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
      results.forEach((cronJob) => {
        systemAlerts[cronJob.name].stop();
      })
    }
  });

  setInterval(Meteor.bindEnvironment(() => {
    let results = SystemAlerts.collection.find({isCronJob: true}).fetch();

    results.forEach((cronJob, index) => {

      if (oldTimes[index] === cronJob.schedule) {
      } else {
        oldTimes[index] = cronJob.schedule;
        systemAlerts[cronJob.name].stop();
        systemAlerts[cronJob.name] = jobs[cronJob.name](cronJob, index);
      }
    });
  }), 10000);
}


function weeklyCopperAlert(cronJob, index){
  let autoStart:boolean;
  autoStart = cronJob.start;
  console.log('autoStart', autoStart);
  console.log('schedule', cronJob.schedule);
  return new CronJob({

    cronTime: cronJob.schedule,
    // cronTime: "*/30 * * * * *",
    timeZone: Meteor.settings.public.timeZone,
    onTick: Meteor.bindEnvironment(() => {
      cronJob = SystemAlerts.collection.findOne({_id: cronJob._id});
      if (Meteor.settings.public.isProduction && autoStart) {
        console.log('is production');
        let data = cronJob.data;
        let currentDate;
        if ('currentDate' in cronJob && cronJob.currentDate != '') {
          currentDate = new Date(cronJob.currentDate);
          currentDate = moment(currentDate).tz(Meteor.settings.public.timeZone).format();
        } else {
          currentDate = moment(new Date()).tz(Meteor.settings.public.timeZone).format();
          // currentDate  = toTimeZone(new Date(), 'America/Chicago');
        }

        let currentTime = moment(currentDate).tz(Meteor.settings.public.timeZone).format('YYYY-MM-DD');
        let lastUpdatedTime = moment(data.updatedAt).tz(Meteor.settings.public.timeZone).format("YYYY-MM-DD");
        let lastSentTime = moment(data.sentAt).tz(Meteor.settings.public.timeZone).format("YYYY-MM-DD");

        let formattedDate = moment(currentDate).tz(Meteor.settings.public.timeZone).format('YYYY-MM-DD');

        if (currentTime !== lastSentTime) {
          let request = Npm.require('request');
          let requestUrl = "https://www.quandl.com/api/v3/datasets/CHRIS/CME_HG1.json?start_date=" + formattedDate + "&end_date=" + formattedDate + "&api_key=Ub_eHVALYv4XxKzL_6x5";

          console.log('request url', requestUrl);
          request(requestUrl,
            Meteor.bindEnvironment(function (error, response, body) {
              if (!error && response.statusCode == 200) {
                const copperObj = JSON.parse(body);
                let emailData:any = cronJob.email;

                if (copperObj.dataset.data.length > 0) {
                  let copperPrice = copperObj.dataset.data[0][4];

                  let priceChange = Number(copperPrice) - Number(data.value);
                  let color ='black';
                  if (priceChange > 0) {
                    color = 'green';
                  } else if (priceChange < 0) {
                    color = 'red';
                  }
                  let percentage = (priceChange/Number(data.value)) * 100;
                  let html = `<body>The Copper Price closed at $ ` + copperPrice + ` this week <br><br>`;
                  html += `<h3>Here are the facts Jack:</h3>`;
                  html += `Last Updated Cost Date: ` + lastUpdatedTime + `<br>`;
                  html += `Last Updated Copper Price: $ ` + data.value + `<br>`;
                  html += `Percentage Changes: <span style="color: ` + color + `">`+ percentage.toFixed(1) + `%</span></body>`;

                  emailData.html = html;

                  let update = {
                    $set: {
                      "data.sentAt": currentDate
                    }
                  };

                  SystemAlerts.collection.update({_id: cronJob._id}, update);
                  Email.send(emailData);
                } else {
                  console.log('data not ready');
                }
              } else {
                console.log('not data');
              }
            }))
        } else {

        }
      } else {
        console.log('in development');
      }
    }),
    start: autoStart
  });
}