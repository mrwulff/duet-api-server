require("dotenv").config();
import config from "../util/config.js";
import { strict } from "assert";
import nodeSchedule from "node-schedule";
import sqlHelpers from "../util/sqlHelpers.js";
import paypalHelpers from "../util/paypalHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
var CronJob = require('cron').CronJob;

const conn = config.dbInitConnect(); // SQL
const sgMail = config.sendgridInit(); // Sendgrid

async function itemPaid(req, res) {
  console.log('in item paid route');
  let store_ids = [];
  let donationInfo = req.body;
  console.log(`Donation info: ${JSON.stringify(donationInfo)}`);
  if (donationInfo.itemIds) {
    try {
      // Create Donation entry
      let donationId;
      if (process.env.PAYPAL_MODE === "live" && !donationInfo.email) {
        console.log("Error: Call to itemPaid() without donor email in live mode!");
        res.status(500).send("Error: Could not retrieve donor email!");
      } else if (process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email) {
        console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");
        donationId = await sqlHelpers.insertDonationIntoDB(donationInfo);
      } else {
        donationId = await sqlHelpers.insertDonationIntoDB(donationInfo);
      }

      // Mark items as donated
      donationInfo.itemIds.forEach(async function (itemId) {
        await sqlHelpers.markItemAsDonated(itemId, donationId);
      });
      console.log("Successfully marked items as donated: " + donationInfo.itemIds);

      // Send PayPal payout to stores with payment_method='paypal'
      if (process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox") {
        let payoutInfo = await sqlHelpers.getPayoutInfo(donationInfo.itemIds);
        payoutInfo.forEach(singleStoreResult => {
          paypalHelpers.sendPayout(
            singleStoreResult.paypal,
            singleStoreResult.payment_amount,
            "EUR",
            singleStoreResult.item_ids
            );
          console.log("Successfully sent payout(s) for item IDs: " + donationInfo.itemIds);
        });
      }

      if (process.env.SET_STORE_NOTIFICATION_FLAG === 'true') {
        await sqlHelpers.setStoreNotificationFlags(donationInfo.itemIds);
      }

      // SEND EMAIL TO DONOR
      if (donationInfo.email) {
        let donorInfo = {
          email: donationInfo.email,
          firstName: donationInfo.firstName
        }
        sendgridHelpers.sendDonorThankYouEmail(donorInfo);
      }

    } catch (err) {
      errorHandler.handleError(err, "donate/itemPaid");
      res.status(500).send({ error: err });
    }
    return res.status(200).send();
  } else {
    console.log('Item ids not found in request body for item donation');
    return res.status(200).json();
  }
}

function testDBConnection(req, res) {
  conn.connect(function(err) {
    if (err) {
      console.log("ERROR connection to db: " + err.stack);
    }
    return false;
  });

  conn.execute("SELECT * from stores", function(err) {
    if (err) {
      console.log("error connecting to db: " + err);
      res.status(400).send("ERROR: failed to connect to db.");
    }
    res.status(200).send("SUCCESS: connected to db.");
  });
}



// CRON job to send notification email to storeowner every day at 8:00 AM if there are
// novel items to that (1) need price approval or (2) need to be picked up.
new CronJob(process.env.CRON_INTERVAL, function() {
  console.log('running cron job checking if stores need to be notified...');
  sendStoreownerNotificationEmail();
}, null, true, 'America/Los_Angeles');



async function sendStoreownerNotificationEmail(req, res) {
  try {
    // Get stores that need notifying
    let results = await sqlHelpers.getStoresThatNeedNotification();

    if (results.length < 1) {
      // no stores need notification
      console.log('No stores need notification currently');
      return;
    }

    // Loop through each of the stores that require a notification
    results.forEach(async function (result) {
      // Get items for store
      const updatedItems = await sqlHelpers.getItemsForNotificationEmail(result.store_id);
      if (updatedItems.length === 0) {
        console.log('No new updates to items');
        return;
      }

      // Get recipient list
      let recipientList = [];
      if (process.env.STORE_NOTIFICATION_BEHAVIOR === 'sandbox') {
        recipientList = ['duet.giving@gmail.com'];
      } else if (process.env.STORE_NOTIFICATION_BEHAVIOR === 'live') {
        recipientList = ['duet.giving@gmail.com', result.email];
      }

      // Send email
      sendgridHelpers.sendStoreNotificationEmail({
        recipientList: recipientList,
        name: result.name,
        email: result.email,
        updatedItems: updatedItems
      });

      // Reset items' notification flags
      sqlHelpers.unsetItemsNotificationFlag(updatedItems.map(item => item.itemId));
    });

    // set needs_notification to false for everyone...
    sqlHelpers.resetStoreNotificationFlags();
  } catch (err) {
    errorHandler.handleError(err, "donate/sendStoreownerNotificationEmail");
    res.status(500).send();
  }
}

export default {
  itemPaid,
  sendStoreownerNotificationEmail,
  testDBConnection,
};
