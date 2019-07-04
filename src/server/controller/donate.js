import db from "./../config/config.js";
import { strict } from "assert";
import nodeSchedule from "node-schedule";
var CronJob = require('cron').CronJob;



require("dotenv").config();

const SET_STORE_NOTIFICATION_FLAG = true;

// connect to DB
const conn = db.dbInitConnect();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// connect to Paypal
("use strict");
var paypalConfig = {
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
};
var paypal = require("paypal-rest-sdk");
paypal.configure(paypalConfig);

function itemPaid(req, res) {
  console.log('in item paid route');
  let store_ids = [];
  let body = req.body;
  console.log(`Request body: ${JSON.stringify(body)}`);
  if (body.itemIds) {
    // set item to fulfilled

    let insertDonationQuery = "";
    let insertDonationValues = [];

    // if we got the donor email, then insert that into the donation entry
    if (body.email) {
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?,?)";
      insertDonationValues = [
        body.firstName,
        body.lastName,
        body.email,
        body.amount,
        body.bankTransferFee,
        body.serviceFee,
        body.country
      ]
    } else if (process.env.PAYPAL_MODE === "sandbox") {
      console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?)";
      insertDonationValues = [
        body.firstName,
        body.lastName,
        body.amount,
        body.bankTransferFee,
        body.serviceFee,
        body.country
      ]
    } else {
      console.log("Error: Call to itemPaid() without donor email in live mode!");
      res.status(500).send("Error: Could not retrieve donor email!");
    }

    conn.execute(
      insertDonationQuery,
      insertDonationValues,
      // need to get all the item_ids, see which store_ids they map to, and then set the needs_notification status of all those stores to true.
      function(err) {
        if (err) {
          console.log(`Error when inserting into donations table: ${err}`);
          res.status(500).send(err);
        } else {
          body.itemIds.forEach(function(id) {
            // add entry into donations table
            conn.query(
              "UPDATE items " +
              "INNER JOIN stores USING(store_id) " +
              "SET status='PAID', " +
              "donation_id=(SELECT LAST_INSERT_ID()), " +
              "in_notification=CASE payment_method WHEN 'paypal' THEN 1 ELSE in_notification END " +
              "WHERE item_id=?",
              [id],
              function(err) {
                if (err) {
                  console.log(`Error when adding entry for item id=${id} into donations table! ${err}`);
                }
              }
            );
          });

          // Send PayPal payout to stores with payment_method='paypal'
          if (process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox") {
            conn.query("SELECT stores.paypal AS paypal, " +
              "payouts.payment_amount AS payment_amount, " +
              "payouts.item_ids AS item_ids " +
              "FROM stores AS stores " +
              "INNER JOIN (" +
                "SELECT store_id, " +
                "SUM(price_euros) AS payment_amount, " +
                "GROUP_CONCAT(item_id) AS item_ids " +
                "FROM items " +
                "WHERE item_id IN (?) " +
                "GROUP BY store_id" +
              ") AS payouts " +
              "USING(store_id) " +
              "WHERE stores.payment_method = 'paypal'",
              [body.itemIds],
              function (err, results, fields) {
                if (err) {
                  console.log(`Error when running payouts SQL query: ${err}`);
                }
                else {
                  // console.log("Payouts query results: " + String(results));
                  results.forEach(result => {
                    let itemIdsList = result.item_ids.split(",");
                    sendPayout(result.paypal, result.payment_amount, "EUR", itemIdsList);
                  });
                }
              });
          }

          if (SET_STORE_NOTIFICATION_FLAG) {
            // find all the stores that paid items interact with
            conn.query(
              `SELECT store_id FROM items WHERE item_id IN (${body.itemIds.join()})`,
              function (err, results, fields) {
                if (err) {
                  console.log(err);
                }

                results.forEach(function (result) {
                  store_ids.push(result.store_id);
                });

                // update the needs_notification flag for each of these stores to be true
                // need to confirm payment received before we can move them to be ready for pickup...
                // only do this for stores with payment_method='paypal'
                conn.query(
                  `UPDATE stores SET needs_notification=1 WHERE store_id IN (${store_ids.join()})` +
                  ` AND payment_method='paypal'`,
                  function(err, results, fields) {
                    if (err) {
                      console.log(err);
                    }
                    console.log(`Notification flag updated sucessfully for stores: ${store_ids}`);
                  }
                );
              }
            );

            // SEND EMAIL TO DONOR
            if (body.email) {
              const msg = {
                to: body.email,
                from: "duet@giveduet.org",
                templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
                dynamic_template_data: {
                  name: body.firstName
                }
              };

              sgMail
                .send(msg)
                .then(() => {
                  console.log(`Donation confirmation sent ${body.email} to successfully.`);
                })
                .catch(error => {
                  console.error(error.toString());
                });
            }
            return res.status(200).send();
          }
        }
      }
    );
  } else {
    console.log('Item ids not found in request body for item donation');
    return res.status(200).json();
  }
}

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
function sendPayout(payeeEmail, amount, currencyCode, itemIds) {
  var itemIdsStr = itemIds.map(id => "#" + String(id)); // e.g. ["#63", "#43"]
  var note = "Payment for Item IDs: " + itemIdsStr.join(", "); // e.g. "Item IDs: #79, #75, #10"

  console.log("Attempting payout of " + String(amount) + " " + String(currencyCode) + " to " + payeeEmail);

  var payoutInfo = {
    sender_batch_header: {
      email_subject: "You have a payment from Duet!"
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount,
          currency: currencyCode
        },
        receiver: payeeEmail,
        note: note
      }
    ]
  };

  var sync_mode = "false";

  paypal.payout.create(payoutInfo, sync_mode, function(error, payoutResp) {
    if (error) {
      console.log(error.response);
      return false;
    } else {
      console.log(payoutResp);
      return true;
    }
  });
}

function sendConfirmationEmail(req, res) {
  var body = req.body;

  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: body.email,
    from: "duet@giveduet.org",
    templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
    dynamic_template_data: {
      name: body.firstName
    }
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Message delived successfully.");
      res.status(200).send("Message delivered.");
    })
    .catch(error => {
      console.error(error.toString());
      res.send("Failed to deliver message.");
    });
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

        let subject = "Duet: The following items need your attention!";
        if (process.env.DATABASE === 'duet_sandbox') {
          subject = "[SANDBOX] Duet: The following items need your attention!"
        }
        const msg = {
          to: recipientList,
          from: "duet@giveduet.org",
          templateId: "d-435a092f0be54b07b5135799ac7dfb01",
          dynamic_template_data: {
            storeName: result.name,
            items: updatedItems,
            subject: subject
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
  sendConfirmationEmail,
  sendStoreownerNotificationEmail,
  testDBConnection,
  updateNotificationFlag
};
