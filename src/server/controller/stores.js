import sqlHelpers from "../util/sqlHelpers.js";
import storeHelpers from '../util/storeHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from "../util/errorHandler.js";

var CronJob = require('cron').CronJob;

// CRON job to send notification email to storeowner every day at 8:00 AM if there are
  // novel items to that (1) need price approval or (2) need to be picked up.
  // Also moves REQUESTED items to LISTED (and sets notification flags)
  // TODO: async/await stuff
new CronJob(process.env.CRON_INTERVAL_STORE_NOTIFICATIONS, async function () {
  console.log('running cron job to move REQUESTED items to LISTED...');
  await itemHelpers.listRequestedItemsAndSetNotificiationFlags();
  console.log('running cron job checking if stores need to be notified...');
  await storeHelpers.sendNotificationEmailsToStores();
}, null, true, 'America/Los_Angeles');

async function login(req, res) {
  try {
    let email = req.body.email;
    if (email) {
      let storeResult = await sqlHelpers.getStoreInfoFromEmail(email);
      if (!storeResult) {
        res.status(400).send({ err: "Store email does not exist" });
      }
      else {
        res.status(200).send({
          storeId: storeResult["store_id"],
          name: storeResult["name"],
          email: storeResult["email"]
        });
      }
    } else {
      res.status(400).send({ err: "Missing email in request body " });
    }
  } catch (err) {
    errorHandler.handleError(err, "stores/login");
    res.status(500).send();
  }
}

export default { 
  login 
};