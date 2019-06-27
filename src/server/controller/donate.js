require("dotenv").config();
import config from "../util/config.js";
import { strict } from "assert";
import nodeSchedule from "node-schedule";
import sqlHelpers from "../util/sqlHelpers.js";
import paypalHelpers from "../util/paypalHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
var CronJob = require('cron').CronJob;

const SET_STORE_NOTIFICATION_FLAG = true;

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

      if (SET_STORE_NOTIFICATION_FLAG) {
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

function getItemsForNotificationEmail(result) {
  return new Promise(function(resolve, reject) {
    let updatedItems=[];
    conn.query(`SELECT * from items where store_id=${result.store_id} and in_notification=1`, function(err, rows) {
      if (err) {
        console.log("Error querying database: " + err);
        return reject(err);
      }
      if (rows.length === 0) {
        console.log('no items included in notification');
      } 
      else {
        let item;
        rows.forEach(function(obj) {
          item = {
            itemId: obj.item_id,
            itemImage: obj.link,
            itemName: obj.name,
            itemPrice: obj.price_euros,
          }
          updatedItems.push(item);
        });
      }
      resolve(updatedItems);
    });
  });
}

function sendStoreownerNotificationEmail(req, res) {
  conn.query("SELECT * from stores where needs_notification=1", function(
    err,
    results,
  ) {
    if (err) {
      console.log("Error querying database: " + err);
      return;
    }

    if (results.length < 1) {
      // no stores need notification
      console.log('No stores need notification currently');
      return;
    }

    // Loop through each of the stores that require a notification
    results.forEach(async function(result) {
      try {
        const updatedItems = await getItemsForNotificationEmail(result);
        if (updatedItems.length === 0) {
          console.log('No new updates to items');
          return;
        }

        let recipientList;
        if (process.env.DATABASE === 'duet_sandbox') {
          recipientList = ['duet.giving@gmail.com'];
        } else {
          recipientList = ['duet.giving@gmail.com', result.email];
        }

        const msg = {
          to: recipientList,
          from: "duet@giveduet.org",
          templateId: "d-435a092f0be54b07b5135799ac7dfb01",
          dynamic_template_data: {
            storeName: result.name,
            items: updatedItems,
          }
        };

        sgMail
          .sendMultiple(msg)
          .then(() => {
            console.log(`Message delivered to ${result.name} at ${result.email} successfully.`);
          })
          .catch(error => {
            console.error("Error: " + error.toString());
            return;
          });

        let updateItemNotificationQuery = `UPDATE items SET in_notification=0 where item_id IN (${updatedItems.map(item => item.itemId).join()})`;
        conn.query(updateItemNotificationQuery, function(err) {
          if (err) {
            console.log("error: " + err);
          }
        })
      } catch (err) {
        console.log("Error getting new updated items: " + err);
        return; 
      }
    });

    // set needs_notification to false for everyone...
    // TODO: Once we have a lot of stores, setting all of them to false will be inefficient
    conn.query("UPDATE stores SET needs_notification=0", function(
      err,
    ) {
      if (err) {
        console.log("error: " + err);
        return;
      }
    });
  });
}

// Tester function to update the needs_notification flag of a particular store_id to true.
// Pass in store_id as a query parameter.
function updateNotificationFlag(req, res) {
  let store_ids = req.body.store_ids;
  // console.log("updating store_id: " + store_id);
  conn.query(
    `UPDATE stores SET needs_notification=1 WHERE store_id IN (${store_ids.join()})`,
    function(err, results, fields) {
      if (err) {
        console.log(err);
        res.status(400).send();
      }
      res.status(200).send("Notification Flag updated successfully.");
    }
  );
}

export default {
  itemPaid,
  sendStoreownerNotificationEmail,
  testDBConnection,
  updateNotificationFlag
};
