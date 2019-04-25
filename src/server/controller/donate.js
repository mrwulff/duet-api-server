import db from "./../config/config.js";
import { strict } from "assert";
import nodeSchedule from "node-schedule";

require("dotenv").config();

const SET_STORE_NOTIFICATION_FLAG = false;

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
  let store_ids = [];
  let body = req.body;
  if (body.itemIds) {
    // set item to fulfilled
    conn.execute(
      "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donor_phone,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?,?,?)",
      [
        body.firstName,
        body.lastName,
        body.email,
        body.phoneNumber,
        body.amount,
        body.bankTransferFee,
        body.serviceFee,
        body.country
      ],

      // need to get all the item_ids, see which store_ids they map to, and then set the needs_notification status of all those stores to true.
      function(err) {
        if (err) {
          console.log(err);
          res.status(400).send();
        } else {
          body.itemIds.forEach(function(id) {
            // add entry into donations table
            conn.execute(
              "UPDATE items SET status='PAID',donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
              [id],
              function(err) {
                if (err) {
                  console.log("Error when adding entry into donations table!");
                  console.log(err);
                  res.status(400).send();
                } else {
                  res.status(200).send();
                }
              }
            );

            if (SET_STORE_NOTIFICATION_FLAG) {
              // find all the stores that paid items interact with
              conn.query(
                "SELECT store_id FROM items WHERE item_id IN (" +
                body.itemIds.join() +
                ")",
                function (err, results, fields) {
                  if (err) {
                    console.log("Error when finding stores that paid items interact with!");
                    console.log(err);
                    res.status(400).send();
                  }

                  results.forEach(function (result) {
                    store_ids.push(result.store_id);
                  });
                }
              );

              // update the needs_notification flag for each of these stores to be true -- need to confirm payment received before
              // we can move them to be ready for pickup...
              conn.query(
                "UPDATE stores SET needs_notification=1 WHERE store_id IN (" +
                store_ids.join() +
                ")",
                function (err, results, fields) {
                  if (err) {
                    // TODO: fix this SQL syntax error
                    console.log("Error when setting stores notification flag!");
                    console.log("store_ids: ", store_ids);
                    console.log("Query: " + "UPDATE stores SET needs_notification=1 WHERE store_id IN (" +
                      store_ids.join() +
                      ")");
                    console.log(err);
                    res.status(400).send();
                  }
                }
              );
            }
          });
        }
      }
    );
  } else {
    res.status(400).json();
  }
}

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
function sendPayout(payeeEmail, amount, currencyCode, itemIds) {
  var itemIdsStr = itemIds.map(id => "#" + id.toString()); // e.g. ["#63", "#43"]
  var note = "Item IDs: " + itemIdsStr.join(", "); // e.g. "Item IDs: #79, #75, #10"

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
    from: "duet.giving@gmail.com",
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

var j = nodeSchedule.scheduleJob("00 8 * * *", function() {
  // disable CRON job if we're working on sandbox.
  if (process.env.DATABASE == "duet_sandbox") {
    return;
  }

  // TODO: make this active!
  return;

  conn.query("SELECT * from stores where needs_notification=1", function(
    err,
    results,
    fields
  ) {
    if (err) {
      console.log("Error querying database: " + err);
    }

    // TODO: send email notification to all store emails
    results.forEach(function(result) {
      const msg = {
        to: result.email,
        from: "duet.giving@gmail.com",
        templateId: "d-435a092f0be54b07b5135799ac7dfb01",
        dynamic_template_data: {
          storeName: result.name
        }
      };

      sgMail
        .send(msg)
        .then(() => {
          console.log("Message delivered to " + result.name + " successfully.");
        })
        .catch(error => {
          console.error("Error: " + error.toString());
          res.status(400).send("Failed to deliver message.");
        });
    });

    // set needs_notification to false for everyone...
    conn.query("UPDATE stores SET needs_notification=0", function(
      err,
      results,
      fields
    ) {
      if (err) {
        console.log("error: " + err);
        res
          .status(400)
          .send("Failed to update stores notification settings...");
      }
    });

    res
      .status(200)
      .send("All storeowner notifications delivered successfully.");
  });
});

// Tester function to go through all stores that need to receive a nudge email, send the email, and set all flags to false.
// NOTE: the "to" email here is set to duet.giving@gmail.com to make sure we don't accidentally send stores a bunch of emails.
function sendStoreownerNotificationEmail(req, res) {
  conn.query("SELECT * from stores where needs_notification=1", function(
    err,
    results,
    fields
  ) {
    if (err) {
      console.log("Error querying database: " + err);
    }

    // TODO: send email notification to all store emails
    results.forEach(function(result) {
      const msg = {
        to: "duet.giving@gmail.com",
        from: "duet.giving@gmail.com",
        templateId: "d-435a092f0be54b07b5135799ac7dfb01",
        dynamic_template_data: {
          storeName: result.name
        }
      };

      sgMail
        .send(msg)
        .then(() => {
          console.log("Message delivered to " + result.name + " successfully.");
        })
        .catch(error => {
          console.error("Error: " + error.toString());
          res.status(400).send("Failed to deliver message.");
        });
    });

    // set needs_notification to false for everyone...
    conn.query("UPDATE stores SET needs_notification=0", function(
      err,
      results,
      fields
    ) {
      if (err) {
        console.log("error: " + err);
        res
          .status(400)
          .send("Failed to update stores notification settings...");
      }
    });

    res
      .status(200)
      .send("All storeowner notifications delivered successfully.");
  });
}

// Tester function to update the needs_notification flag of a particular store_id to true.
// Pass in store_id as a query parameter.
function updateNotificationFlag(req, res) {
  let store_id = req.query.storeId;
  // console.log("updating store_id: " + store_id);
  conn.query(
    "UPDATE stores SET needs_notification=1 WHERE store_id=" + store_id,
    function(err, results, fields) {
      if (err) {
        console.log(err);
        res.status(400).send();
      }
      res.status(200).send("Flag updated successfully.");
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
