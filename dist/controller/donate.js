"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _assert = require("assert");
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _paypalHelpers = _interopRequireDefault(require("../util/paypalHelpers.js"));
var _sendgridHelpers = _interopRequireDefault(require("../util/sendgridHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}require("dotenv").config();
var CronJob = require('cron').CronJob;function

itemPaid(_x, _x2) {return _itemPaid.apply(this, arguments);}



































































// CRON job to send notification email to storeowner every day at 8:00 AM if there are
// novel items to that (1) need price approval or (2) need to be picked up.
function _itemPaid() {_itemPaid = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {var donationInfo, donationId, payoutInfo, donorInfo;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:donationInfo = req.body;console.log("itemPaid donation info: ".concat(JSON.stringify(donationInfo)));if (!donationInfo.itemIds) {_context2.next = 39;break;}_context2.prev = 3;if (!(process.env.PAYPAL_MODE === "live" && !donationInfo.email)) {_context2.next = 9;break;}console.log("Error: Call to itemPaid() without donor email in live mode!");res.status(500).send("Error: Could not retrieve donor email!");_context2.next = 19;break;case 9:if (!(process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email)) {_context2.next = 16;break;}console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");_context2.next = 13;return _sqlHelpers["default"].insertDonationIntoDB(donationInfo);case 13:donationId = _context2.sent;_context2.next = 19;break;case 16:_context2.next = 18;return _sqlHelpers["default"].insertDonationIntoDB(donationInfo);case 18:donationId = _context2.sent;case 19:donationInfo.itemIds.forEach( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId) {var itemResult;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return _sqlHelpers["default"].markItemAsDonated(itemId, donationId);case 2:_context.next = 4;return _sqlHelpers["default"].getItem(itemId);case 4:itemResult = _context.sent;if (itemResult) {_sendgridHelpers["default"].sendItemStatusUpdateEmail(itemResult);}case 6:case "end":return _context.stop();}}}, _callee);}));return function (_x5) {return _ref.apply(this, arguments);};}());console.log("Successfully marked items as donated: " + donationInfo.itemIds); // Send PayPal payout to stores with payment_method='paypal'
            if (!(process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox")) {_context2.next = 26;break;}_context2.next = 24;return _sqlHelpers["default"].getPayoutInfo(donationInfo.itemIds);case 24:payoutInfo = _context2.sent;payoutInfo.forEach(function (singleStoreResult) {_paypalHelpers["default"].sendPayout(singleStoreResult.paypal, singleStoreResult.payment_amount, "EUR", singleStoreResult.item_ids);console.log("Successfully sent payout(s) for item IDs: " + donationInfo.itemIds);});case 26:if (!(process.env.SET_STORE_NOTIFICATION_FLAG === 'true')) {_context2.next = 29;break;}_context2.next = 29;return _sqlHelpers["default"].setStoreNotificationFlags(donationInfo.itemIds);case 29: // SEND EMAIL TO DONOR
            if (donationInfo.email) {donorInfo = { email: donationInfo.email, firstName: donationInfo.firstName };_sendgridHelpers["default"].sendDonorThankYouEmail(donorInfo);}_context2.next = 36;break;case 32:_context2.prev = 32;_context2.t0 = _context2["catch"](3);_errorHandler["default"].handleError(_context2.t0, "donate/itemPaid");res.status(500).send({ error: _context2.t0 });case 36:return _context2.abrupt("return", res.status(200).send());case 39:console.log('Item ids not found in request body for item donation');return _context2.abrupt("return", res.status(200).json());case 41:case "end":return _context2.stop();}}}, _callee2, null, [[3, 32]]);}));return _itemPaid.apply(this, arguments);}new CronJob(process.env.CRON_INTERVAL, function () {console.log('running cron job checking if stores need to be notified...');sendStoreownerNotificationEmail();
}, null, true, 'America/Los_Angeles');function



sendStoreownerNotificationEmail(_x3, _x4) {return _sendStoreownerNotificationEmail.apply(this, arguments);}function _sendStoreownerNotificationEmail() {_sendStoreownerNotificationEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {var results;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.prev = 0;_context4.next = 3;return (


              _sqlHelpers["default"].getStoresThatNeedNotification());case 3:results = _context4.sent;if (!(

            results.length < 1)) {_context4.next = 7;break;}
            // no stores need notification
            console.log('No stores need notification currently');return _context4.abrupt("return");case 7:



            // Loop through each of the stores that require a notification
            results.forEach( /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(result) {var updatedItems, recipientList;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_context3.next = 2;return (

                          _sqlHelpers["default"].getItemsForNotificationEmail(result.store_id));case 2:updatedItems = _context3.sent;if (!(
                        updatedItems.length === 0)) {_context3.next = 6;break;}
                        console.log('No new updates to items');return _context3.abrupt("return");case 6:



                        // Get recipient list
                        recipientList = [];
                        if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
                          recipientList = ['duet.giving@gmail.com'];
                        } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
                          recipientList = ['duet.giving@gmail.com', result.email];
                        }

                        // Send email
                        _sendgridHelpers["default"].sendStoreNotificationEmail({
                          recipientList: recipientList,
                          name: result.name,
                          email: result.email,
                          updatedItems: updatedItems });


                        // Reset items' notification flags
                        _sqlHelpers["default"].unsetItemsNotificationFlag(updatedItems.map(function (item) {return item.itemId;}));case 10:case "end":return _context3.stop();}}}, _callee3);}));return function (_x6) {return _ref2.apply(this, arguments);};}());


            // set needs_notification to false for everyone...
            _sqlHelpers["default"].resetStoreNotificationFlags();_context4.next = 15;break;case 11:_context4.prev = 11;_context4.t0 = _context4["catch"](0);

            _errorHandler["default"].handleError(_context4.t0, "donate/sendStoreownerNotificationEmail");
            res.status(500).send();case 15:case "end":return _context4.stop();}}}, _callee4, null, [[0, 11]]);}));return _sendStoreownerNotificationEmail.apply(this, arguments);}var _default =



{
  itemPaid: itemPaid,
  sendStoreownerNotificationEmail: sendStoreownerNotificationEmail };exports["default"] = _default;