"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("../util/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}
var paypal = _config["default"].paypalInit(); // PayPal

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
}var _default =

{
  sendPayout: sendPayout };exports["default"] = _default;