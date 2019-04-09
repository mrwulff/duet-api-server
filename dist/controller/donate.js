"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));
var _assert = require("assert");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

require('dotenv').config();

// connect to DB
var conn = _config.default.dbInitConnect();

// connect to Paypal
"use strict";
var paypalConfig = {
  'mode': process.env.PAYPAL_MODE,
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET };

var paypal = require('paypal-rest-sdk');
paypal.configure(paypalConfig);

function fulfillNeed(req, res) {
  var body = req.body;
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
    body.country],

    function (err) {
      if (err) {
        console.log(err);
        res.status(400).send();
      } else {
        body.itemIds.forEach(function (id) {
          // add entry into donations table
          conn.execute(
          "UPDATE items SET is_fulfilled=true,donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
          [id],
          function (err) {
            if (err) {
              console.log(err);
              res.status(400).send();
            } else {
              res.status(200).send();
            }
          });

        });
      }
    });

  } else {
    res.status(400).json();
  }
}

function itemPaid(req, res) {
  var body = req.body;
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
    body.country],

    function (err) {
      if (err) {
        console.log(err);
        res.status(400).send();
      } else {
        body.itemIds.forEach(function (id) {
          // add entry into donations table
          conn.execute(
          "UPDATE items SET paid=true,donation_id=(SELECT LAST_INSERT_ID()) WHERE item_id=?",
          [id],
          function (err) {
            if (err) {
              console.log(err);
              res.status(400).send();
            } else {
              res.status(200).send();
            }
          });

        });
      }
    });

  } else {
    res.status(400).json();
  }

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
function sendPayout(payeeEmail, amount, currencyCode, itemIds) {

  var itemIdsStr = itemIds.map(function (id) {return "#" + id.toString();}); // e.g. ["#63", "#43"]
  var note = "Item IDs: " + itemIdsStr.join(", "); // e.g. "Item IDs: #79, #75, #10"

  var payoutInfo = {
    "sender_batch_header": {
      "email_subject": "You have a payment from Duet!" },

    "items": [
    {
      "recipient_type": "EMAIL",
      "amount": {
        "value": amount,
        "currency": currencyCode },

      "receiver": payeeEmail,
      "note": note }] };




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
}var _default =

{ fulfillNeed: fulfillNeed, itemPaid: itemPaid };exports.default = _default;
