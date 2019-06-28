"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));
var _assert = require("assert");
var _nodeSchedule = _interopRequireDefault(require("node-schedule"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
var CronJob = require('cron').CronJob;



require("dotenv").config();

var SET_STORE_NOTIFICATION_FLAG = true;

// connect to DB
var conn = _config["default"].dbInitConnect();

var sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// connect to Paypal
"use strict";
var paypalConfig = {
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET };

var paypal = require("paypal-rest-sdk");
paypal.configure(paypalConfig);

function itemPaid(req, res) {
  console.log('in item paid route');
  var store_ids = [];
  var body = req.body;
  console.log("Request body: ".concat(JSON.stringify(body)));
  if (body.itemIds) {
    // set item to fulfilled

    var insertDonationQuery = "";
    var insertDonationValues = [];

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
      body.country];

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
      body.country];

    } else {
      console.log("Error: Call to itemPaid() without donor email in live mode!");
      res.status(500).send("Error: Could not retrieve donor email!");
    }

    conn.execute(
    insertDonationQuery,
    insertDonationValues,
    // need to get all the item_ids, see which store_ids they map to, and then set the needs_notification status of all those stores to true.
    function (err) {
      if (err) {
        console.log("Error when inserting into donations table: ".concat(err));
        res.status(500).send(err);
      } else {
        body.itemIds.forEach(function (id) {
          // add entry into donations table
          conn.execute(
          "UPDATE items SET status='PAID', in_notification=1, donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
          [id],
          function (err) {
            if (err) {
              console.log("Error when adding entry for item id=".concat(id, " into donations table! ").concat(err));
            }
          });

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
              console.log("Error when running payouts SQL query: ".concat(err));
            } else
            {
              // console.log("Payouts query results: " + String(results));
              results.forEach(function (result) {
                var itemIdsList = result.item_ids.split(",");
                sendPayout(result.paypal, result.payment_amount, "EUR", itemIdsList);
              });
            }
          });
        }

        if (SET_STORE_NOTIFICATION_FLAG) {
          // find all the stores that paid items interact with
          conn.query("SELECT store_id FROM items WHERE item_id IN (".concat(
          body.itemIds.join(), ")"),
          function (err, results, fields) {
            if (err) {
              console.log(err);
            }

            results.forEach(function (result) {
              store_ids.push(result.store_id);
            });

            // update the needs_notification flag for each of these stores to be true -- need to confirm payment received before we can move them to be ready for pickup...
            conn.query("UPDATE stores SET needs_notification=1 WHERE store_id IN (".concat(
            store_ids.join(), ")"),
            function (err, results, fields) {
              if (err) {
                console.log(err);
              }
              console.log("Notification flag updated sucessfully for stores: ".concat(store_ids));
            });

          });


          // SEND EMAIL TO DONOR
          if (body.email) {
            var msg = {
              to: body.email,
              from: "duet@giveduet.org",
              templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
              dynamic_template_data: {
                name: body.firstName } };



            sgMail.
            send(msg).
            then(function () {
              console.log("Donation confirmation sent ".concat(body.email, " to successfully."));
            })["catch"](
            function (error) {
              console.error(error.toString());
            });
          }
          return res.status(200).send();
        }
      }
    });

  } else {
    console.log('Item ids not found in request body for item donation');
    return res.status(200).json();
  }
}

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
function sendPayout(payeeEmail, amount, currencyCode, itemIds) {
  var itemIdsStr = itemIds.map(function (id) {return "#" + String(id);}); // e.g. ["#63", "#43"]
  var note = "Payment for Item IDs: " + itemIdsStr.join(", "); // e.g. "Item IDs: #79, #75, #10"

  console.log("Attempting payout of " + String(amount) + " " + String(currencyCode) + " to " + payeeEmail);

  var payoutInfo = {
    sender_batch_header: {
      email_subject: "You have a payment from Duet!" },

    items: [
    {
      recipient_type: "EMAIL",
      amount: {
        value: amount,
        currency: currencyCode },

      receiver: payeeEmail,
      note: note }] };




  var sync_mode = "false";

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
  var msg = {
    to: body.email,
    from: "duet@giveduet.org",
    templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
    dynamic_template_data: {
      name: body.firstName } };



  sgMail.
  send(msg).
  then(function () {
    console.log("Message delived successfully.");
    res.status(200).send("Message delivered.");
  })["catch"](
  function (error) {
    console.error(error.toString());
    res.send("Failed to deliver message.");
  });
}

function testDBConnection(req, res) {
  conn.connect(function (err) {
    if (err) {
      console.log("ERROR connection to db: " + err.stack);
    }
    return false;
  });

  conn.execute("SELECT * from stores", function (err) {
    if (err) {
      console.log("error connecting to db: " + err);
      res.status(400).send("ERROR: failed to connect to db.");
    }
    res.status(200).send("SUCCESS: connected to db.");
  });
}



// CRON job to send notification email to storeowner every day at 8:00 AM if there are
// novel items to that (1) need price approval or (2) need to be picked up.
new CronJob(process.env.CRON_INTERVAL, function () {
  console.log('running cron job checking if stores need to be notified...');
  sendStoreownerNotificationEmail();
}, null, true, 'America/Los_Angeles');

function getItemsForNotificationEmail(result) {
  return new Promise(function (resolve, reject) {
    var updatedItems = [];
    conn.query("SELECT * from items where store_id=".concat(result.store_id, " and in_notification=1"), function (err, rows) {
      if (err) {
        console.log("Error querying database: " + err);
        return reject(err);
      }
      if (rows.length === 0) {
        console.log('no items included in notification');
      } else
      {
        var item;
        rows.forEach(function (obj) {
          item = {
            itemId: obj.item_id,
            itemImage: obj.link,
            itemName: obj.name,
            itemPrice: obj.price_euros };

          updatedItems.push(item);
        });
      }
      resolve(updatedItems);
    });
  });
}

function sendStoreownerNotificationEmail(req, res) {
  conn.query("SELECT * from stores where needs_notification=1", function (
  err,
  results)
  {
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
    results.forEach( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(result) {var updatedItems, recipientList, msg, updateItemNotificationQuery;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;_context.next = 3;return (

                  getItemsForNotificationEmail(result));case 3:updatedItems = _context.sent;if (!(
                updatedItems.length === 0)) {_context.next = 7;break;}
                console.log('No new updates to items');return _context.abrupt("return");case 7:




                if (process.env.DATABASE === 'duet_sandbox') {
                  recipientList = ['duet.giving@gmail.com'];
                } else {
                  recipientList = ['duet.giving@gmail.com', result.email];
                }

                msg = {
                  to: recipientList,
                  from: "duet@giveduet.org",
                  templateId: "d-435a092f0be54b07b5135799ac7dfb01",
                  dynamic_template_data: {
                    storeName: result.name,
                    items: updatedItems } };



                sgMail.
                sendMultiple(msg).
                then(function () {
                  console.log("Message delivered to ".concat(result.name, " at ").concat(result.email, " successfully."));
                })["catch"](
                function (error) {
                  console.error("Error: " + error.toString());
                  return;
                });

                updateItemNotificationQuery = "UPDATE items SET in_notification=0 where item_id IN (".concat(updatedItems.map(function (item) {return item.itemId;}).join(), ")");
                conn.query(updateItemNotificationQuery, function (err) {
                  if (err) {
                    console.log("error: " + err);
                  }
                });_context.next = 18;break;case 14:_context.prev = 14;_context.t0 = _context["catch"](0);

                console.log("Error getting new updated items: " + _context.t0);return _context.abrupt("return");case 18:case "end":return _context.stop();}}}, _callee, null, [[0, 14]]);}));return function (_x) {return _ref.apply(this, arguments);};}());




    // set needs_notification to false for everyone...
    // TODO: Once we have a lot of stores, setting all of them to false will be inefficient
    conn.query("UPDATE stores SET needs_notification=0", function (
    err)
    {
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
  var store_ids = req.body.store_ids;
  // console.log("updating store_id: " + store_id);
  conn.query("UPDATE stores SET needs_notification=1 WHERE store_id IN (".concat(
  store_ids.join(), ")"),
  function (err, results, fields) {
    if (err) {
      console.log(err);
      res.status(400).send();
    }
    res.status(200).send("Notification Flag updated successfully.");
  });

}var _default =

{
  itemPaid: itemPaid,
  sendConfirmationEmail: sendConfirmationEmail,
  sendStoreownerNotificationEmail: sendStoreownerNotificationEmail,
  testDBConnection: testDBConnection,
  updateNotificationFlag: updateNotificationFlag };exports["default"] = _default;