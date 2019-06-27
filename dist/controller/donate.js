"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _config = _interopRequireDefault(require("../util/config.js"));
var _assert = require("assert");
var _nodeSchedule = _interopRequireDefault(require("node-schedule"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}require("dotenv").config();
var CronJob = require('cron').CronJob;

var SET_STORE_NOTIFICATION_FLAG = true;

var conn = _config["default"].dbInitConnect(); // SQL
var sgMail = _config["default"].sendgridInit(); // Sendgrid
var paypal = _config["default"].paypalInit(); // PayPal
function
itemPaid(_x, _x2) {return _itemPaid.apply(this, arguments);}





























































































































// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
function _itemPaid() {_itemPaid = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {var store_ids, donationInfo, donationId, payoutInfo, msg;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:console.log('in item paid route');store_ids = [];donationInfo = req.body;console.log("Donation info: ".concat(JSON.stringify(donationInfo)));if (!donationInfo.itemIds) {_context2.next = 38;break;}_context2.prev = 5;if (!(process.env.PAYPAL_MODE === "live" && !donationInfo.email)) {_context2.next = 11;break;}console.log("Error: Call to itemPaid() without donor email in live mode!");res.status(500).send("Error: Could not retrieve donor email!");_context2.next = 21;break;case 11:if (!(process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email)) {_context2.next = 18;break;}console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");_context2.next = 15;return _sqlHelpers["default"].insertDonationIntoDB(donationInfo);case 15:donationId = _context2.sent;_context2.next = 21;break;case 18:_context2.next = 20;return _sqlHelpers["default"].insertDonationIntoDB(donationInfo);case 20:donationId = _context2.sent;case 21:donationInfo.itemIds.forEach(function (id) {// add entry into donations table
              conn.execute("UPDATE items SET status='PAID', in_notification=1, donation_id=? WHERE item_id=?", [donationId, id], function (err) {if (err) {console.log("Error when adding entry for item id=".concat(id, " into donations table! ").concat(err));}});}); // Send PayPal payout to stores with payment_method='paypal'
            if (!(process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox")) {_context2.next = 27;break;}_context2.next = 25;return _sqlHelpers["default"].getPayoutInfo(donationInfo.itemIds);case 25:payoutInfo = _context2.sent;payoutInfo.forEach(function (singleStoreResult) {sendPayout(singleStoreResult.paypal, singleStoreResult.payment_amount, "EUR", singleStoreResult.item_ids);console.log("Successfully sent payout(s) for item IDs: " + donationInfo.itemIds);}); // conn.query("SELECT stores.paypal AS paypal, " +
            //   "payouts.payment_amount AS payment_amount, " +
            //   "payouts.item_ids AS item_ids " +
            //   "FROM stores AS stores " +
            //   "INNER JOIN (" +
            //   "SELECT store_id, " +
            //   "SUM(price_euros) AS payment_amount, " +
            //   "GROUP_CONCAT(item_id) AS item_ids " +
            //   "FROM items " +
            //   "WHERE item_id IN (?) " +
            //   "GROUP BY store_id" +
            //   ") AS payouts " +
            //   "USING(store_id) " +
            //   "WHERE stores.payment_method = 'paypal'",
            //   [donationInfo.itemIds],
            //   function (err, results, fields) {
            //     if (err) {
            //       console.log(`Error when running payouts SQL query: ${err}`);
            //     }
            //     else {
            //       // console.log("Payouts query results: " + String(results));
            //       results.forEach(result => {
            //         let itemIdsList = result.item_ids.split(",");
            //         sendPayout(result.paypal, result.payment_amount, "EUR", itemIdsList);
            //       });
            //     }
            //   });
          case 27:if (SET_STORE_NOTIFICATION_FLAG) {// find all the stores that paid items interact with
              conn.query("SELECT store_id FROM items WHERE item_id IN (".concat(donationInfo.itemIds.join(), ")"), function (err, results, fields) {if (err) {console.log(err);}results.forEach(function (result) {store_ids.push(result.store_id);}); // update the needs_notification flag for each of these stores to be true -- need to confirm payment received before we can move them to be ready for pickup...
                conn.query("UPDATE stores SET needs_notification=1 WHERE store_id IN (".concat(store_ids.join(), ")"), function (err, results, fields) {if (err) {console.log(err);}console.log("Notification flag updated sucessfully for stores: ".concat(store_ids));});});} // SEND EMAIL TO DONOR
            if (donationInfo.email) {msg = { to: donationInfo.email, from: "duet@giveduet.org", templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc", dynamic_template_data: { name: donationInfo.firstName } };sgMail.send(msg).then(function () {console.log("Donation confirmation sent ".concat(donationInfo.email, " to successfully."));})["catch"](function (error) {console.error(error.toString());});}_context2.next = 35;break;case 31:_context2.prev = 31;_context2.t0 = _context2["catch"](5);_errorHandler["default"].handleError(_context2.t0, "donate/itemPaid");res.status(500).send({ error: _context2.t0 });case 35:return _context2.abrupt("return", res.status(200).send());case 38:console.log('Item ids not found in request body for item donation');return _context2.abrupt("return", res.status(200).json());case 40:case "end":return _context2.stop();}}}, _callee2, null, [[5, 31]]);}));return _itemPaid.apply(this, arguments);}function sendPayout(payeeEmail, amount, currencyCode, itemIds) {var itemIdsStr = itemIds.map(function (id) {return "#" + String(id);}); // e.g. ["#63", "#43"]
  var note = "Payment for Item IDs: " + itemIdsStr.join(", "); // e.g. "Item IDs: #79, #75, #10"
  console.log("Attempting payout of " + String(amount) + " " + String(currencyCode) + " to " + payeeEmail);var payoutInfo = { sender_batch_header: { email_subject: "You have a payment from Duet!" }, items: [{ recipient_type: "EMAIL", amount: { value: amount, currency: currencyCode }, receiver: payeeEmail, note: note }] };var sync_mode = "false";paypal.payout.create(payoutInfo, sync_mode, function (error, payoutResp) {if (error) {console.log(error.response);return false;} else {console.log(payoutResp);return true;}});}

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

                console.log("Error getting new updated items: " + _context.t0);return _context.abrupt("return");case 18:case "end":return _context.stop();}}}, _callee, null, [[0, 14]]);}));return function (_x3) {return _ref.apply(this, arguments);};}());




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