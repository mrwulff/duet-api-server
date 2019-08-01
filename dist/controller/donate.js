"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _assert = require("assert");
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _paypalHelpers = _interopRequireDefault(require("../util/paypalHelpers.js"));
var _sendgridHelpers = _interopRequireDefault(require("../util/sendgridHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}require("dotenv").config();function

itemPaid(_x, _x2) {return _itemPaid.apply(this, arguments);}function _itemPaid() {_itemPaid = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {var donationInfo, donationId, payoutInfo, donorInfo;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
            donationInfo = req.body;
            console.log("itemPaid donation info: ".concat(JSON.stringify(donationInfo)));if (!
            donationInfo.itemIds) {_context2.next = 39;break;}_context2.prev = 3;if (!(



            process.env.PAYPAL_MODE === "live" && !donationInfo.email)) {_context2.next = 9;break;}
            console.log("Error: Call to itemPaid() without donor email in live mode!");
            res.status(500).send("Error: Could not retrieve donor email!");_context2.next = 19;break;case 9:if (!(
            process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email)) {_context2.next = 16;break;}
            console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");_context2.next = 13;return (
              _sqlHelpers["default"].insertDonationIntoDB(donationInfo));case 13:donationId = _context2.sent;_context2.next = 19;break;case 16:_context2.next = 18;return (

              _sqlHelpers["default"].insertDonationIntoDB(donationInfo));case 18:donationId = _context2.sent;case 19:



            donationInfo.itemIds.forEach( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId) {var itemResult;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (

                          _sqlHelpers["default"].markItemAsDonated(itemId, donationId));case 2:_context.next = 4;return (


                          _sqlHelpers["default"].getItem(itemId));case 4:itemResult = _context.sent;
                        if (itemResult) {
                          _sendgridHelpers["default"].sendItemStatusUpdateEmail(itemResult);
                        }case 6:case "end":return _context.stop();}}}, _callee);}));return function (_x3) {return _ref.apply(this, arguments);};}());

            console.log("Successfully marked items as donated: " + donationInfo.itemIds);

            // Send PayPal payout to stores with payment_method='paypal'
            if (!(process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox")) {_context2.next = 26;break;}_context2.next = 24;return (
              _sqlHelpers["default"].getPayoutInfo(donationInfo.itemIds));case 24:payoutInfo = _context2.sent;
            payoutInfo.forEach(function (singleStoreResult) {
              _paypalHelpers["default"].sendPayout(
              singleStoreResult.paypal,
              singleStoreResult.payment_amount,
              "EUR",
              singleStoreResult.item_ids);

              console.log("Successfully sent payout(s) for item IDs: " + donationInfo.itemIds);
            });case 26:if (!(


            process.env.SET_STORE_NOTIFICATION_FLAG === 'true')) {_context2.next = 29;break;}_context2.next = 29;return (
              _sqlHelpers["default"].setStoreNotificationFlags(donationInfo.itemIds));case 29:


            // SEND EMAIL TO DONOR
            if (donationInfo.email) {
              donorInfo = {
                email: donationInfo.email,
                firstName: donationInfo.firstName };

              _sendgridHelpers["default"].sendDonorThankYouEmail(donorInfo);
            }_context2.next = 36;break;case 32:_context2.prev = 32;_context2.t0 = _context2["catch"](3);


            _errorHandler["default"].handleError(_context2.t0, "donate/itemPaid");
            res.status(500).send({ error: _context2.t0 });case 36:return _context2.abrupt("return",

            res.status(200).send());case 39:

            console.log('Item ids not found in request body for item donation');return _context2.abrupt("return",
            res.status(200).json());case 41:case "end":return _context2.stop();}}}, _callee2, null, [[3, 32]]);}));return _itemPaid.apply(this, arguments);}var _default =



{
  itemPaid: itemPaid };exports["default"] = _default;