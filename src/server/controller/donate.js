import db from "./../config/config.js";
import { strict } from "assert";
import nodeSchedule from "node-schedule";

require('dotenv').config()

// connect to DB
const conn = db.dbInitConnect();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// connect to Paypal
"use strict";
var paypalConfig = {
  'mode': process.env.PAYPAL_MODE,
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
};
var paypal = require('paypal-rest-sdk');
paypal.configure(paypalConfig);

function fulfillNeed(req, res) {
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
      function(err) {
        if (err) {
          console.log(err);
          res.status(400).send();
        } else {
          body.itemIds.forEach(function(id) {
            // add entry into donations table
            conn.execute(
              "UPDATE items SET is_fulfilled=true,donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
              [id],
              function(err) {
                if (err) {
                  console.log(err);
                  res.status(400).send();
                } else {
                  res.status(200).send();
                }
              }
            );
          });
        }
      }
    );
  } else {
    res.status(400).json();
  }
}

function itemPaid(req, res) {
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
      function(err) {
        if (err) {
          console.log(err);
          res.status(400).send();
        } else {
          body.itemIds.forEach(function(id) {
            // add entry into donations table
            conn.execute(
              "UPDATE items SET paid=true,donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
              [id],
              function(err) {
                if (err) {
                  console.log(err);
                  res.status(400).send();
                } else {
                  res.status(200).send();
                }
              }
            );
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
    "sender_batch_header": {
      "email_subject": "You have a payment from Duet!"
    },
    "items": [
      {
        "recipient_type": "EMAIL",
        "amount": {
          "value": amount,
          "currency": currencyCode
        },
        "receiver": payeeEmail,
        "note": note
      }
    ]
  };

  var sync_mode = 'false';

  paypal.payout.create(payoutInfo, sync_mode, function (error, payoutResp) {
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
    from: 'duet.giving@gmail.com',
    templateId: 'd-2780c6e3d4f3427ebd0b20bbbf2f8cfc',
    dynamic_template_data: {
      name: body.firstName,
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
       res.status(400).send("Failed to deliver message.");
    });  
} 


// send email notification every 24 hours if donor's status has changed...
function sendStoreownerNotificationEmail(req, res) {
  var body = req.body;
  console.log(body);

  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: body.email,
    from: 'duet.giving@gmail.com',
    templateId: 'd-435a092f0be54b07b5135799ac7dfb01',
    dynamic_template_data: {
      storeName: body.storeName,
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
       res.status(400).send("Failed to deliver message.");
    });  
} 


// set up a CRON job to send notification email to storeowner every day at 8:00 AM if there are 
// novel items to that (1) need price approval or (2) need to be 

var j = nodeSchedule.scheduleJob('00 8 * * *', function() {
  
});

export default { fulfillNeed, itemPaid, sendConfirmationEmail, sendStoreownerNotificationEmail};
