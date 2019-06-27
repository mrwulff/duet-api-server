"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();
// Insert message into database
function insertMessageIntoDB(_x) {return _insertMessageIntoDB.apply(this, arguments);}


















// Get all info necessary to send a pickup notification
function _insertMessageIntoDB() {_insertMessageIntoDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message) {var source, sender, recipient, content, conn;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:source = message['source'];sender = message['sender'];recipient = message['recipient'];content = message['content'];_context.prev = 4;_context.next = 7;return _config["default"].dbInitConnectPromise();case 7:conn = _context.sent;_context.next = 10;return conn.query("INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)", [source, sender, recipient, content]);case 10:console.log("Successfully inserted message into database: %j", message);_context.next = 17;break;case 13:_context.prev = 13;_context.t0 = _context["catch"](4);_errorHandler["default"].handleError(_context.t0, "sqlHelper/insertMessageIntoDB");throw _context.t0;case 17:case "end":return _context.stop();}}}, _callee, null, [[4, 13]]);}));return _insertMessageIntoDB.apply(this, arguments);}function getFBMessengerInfoFromItemId(_x2) {return _getFBMessengerInfoFromItemId.apply(this, arguments);}function _getFBMessengerInfoFromItemId() {_getFBMessengerInfoFromItemId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(itemId) {var conn, _ref, _ref2, rows, fields;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context2.sent;_context2.next = 6;return (
              conn.query(
              "SELECT " +
              "items.name AS item_name, items.pickup_code, " +
              "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " +
              "stores.name AS store_name " +
              "FROM items " +
              "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " +
              "INNER JOIN stores ON items.store_id = stores.store_id " +
              "WHERE items.item_id=?",
              [itemId]));case 6:_ref = _context2.sent;_ref2 = _slicedToArray(_ref, 2);rows = _ref2[0];fields = _ref2[1];if (!(

            rows.length === 0)) {_context2.next = 15;break;}
            console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);return _context2.abrupt("return",
            null);case 15:return _context2.abrupt("return",


            rows[0]);case 16:_context2.next = 22;break;case 18:_context2.prev = 18;_context2.t0 = _context2["catch"](0);


            _errorHandler["default"].handleError(_context2.t0, "sqlHelper/getFBMessengerInfoFromItemId");throw _context2.t0;case 22:case "end":return _context2.stop();}}}, _callee2, null, [[0, 18]]);}));return _getFBMessengerInfoFromItemId.apply(this, arguments);}function




insertDonationIntoDB(_x3) {return _insertDonationIntoDB.apply(this, arguments);}function _insertDonationIntoDB() {_insertDonationIntoDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(donationInfo) {var insertDonationQuery, insertDonationValues, conn, _ref3, _ref4, results, fields;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
            // Insert donation info into DB, return insert ID
            insertDonationQuery = "";
            insertDonationValues = [];_context3.prev = 2;_context3.next = 5;return (

              _config["default"].dbInitConnectPromise());case 5:conn = _context3.sent;
            if (donationInfo.email) {
              insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
              " VALUES (NOW(),?,?,?,?,?,?,?)";
              insertDonationValues = [
              donationInfo.firstName,
              donationInfo.lastName,
              donationInfo.email,
              donationInfo.amount,
              donationInfo.bankTransferFee,
              donationInfo.serviceFee,
              donationInfo.country];

            } else {
              insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
              " VALUES (NOW(),?,?,?,?,?,?)";
              insertDonationValues = [
              donationInfo.firstName,
              donationInfo.lastName,
              donationInfo.amount,
              donationInfo.bankTransferFee,
              donationInfo.serviceFee,
              donationInfo.country];

            }_context3.next = 9;return (
              conn.execute(insertDonationQuery, insertDonationValues));case 9:_ref3 = _context3.sent;_ref4 = _slicedToArray(_ref3, 2);results = _ref4[0];fields = _ref4[1];
            console.log("Successfully entered donation into DB: %j", donationInfo);return _context3.abrupt("return",
            results.insertId);case 17:_context3.prev = 17;_context3.t0 = _context3["catch"](2);

            _errorHandler["default"].handleError(_context3.t0, "sqlHelpers/insertDonationIntoDB");throw _context3.t0;case 21:case "end":return _context3.stop();}}}, _callee3, null, [[2, 17]]);}));return _insertDonationIntoDB.apply(this, arguments);}function




markItemAsDonated(_x4, _x5) {return _markItemAsDonated.apply(this, arguments);}function _markItemAsDonated() {_markItemAsDonated = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(itemId, donationId) {var conn;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.prev = 0;_context4.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context4.sent;_context4.next = 6;return (
              conn.query(
              "UPDATE items SET status='PAID', in_notification=1, donation_id=? WHERE item_id=?",
              [donationId, itemId]));case 6:_context4.next = 12;break;case 8:_context4.prev = 8;_context4.t0 = _context4["catch"](0);


            _errorHandler["default"].handleError(_context4.t0, "sqlHelpers/markItemAsDoanted");throw _context4.t0;case 12:case "end":return _context4.stop();}}}, _callee4, null, [[0, 8]]);}));return _markItemAsDonated.apply(this, arguments);}function




getPayoutInfo(_x6) {return _getPayoutInfo.apply(this, arguments);}function _getPayoutInfo() {_getPayoutInfo = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(itemIds) {var conn, _ref5, _ref6, rows, fields;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.prev = 0;_context5.next = 3;return (



              _config["default"].dbInitConnectPromise());case 3:conn = _context5.sent;_context5.next = 6;return (
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
              [itemIds]));case 6:_ref5 = _context5.sent;_ref6 = _slicedToArray(_ref5, 2);rows = _ref6[0];fields = _ref6[1];
            // convert item_ids from string to list
            rows.forEach(function (singleStoreResult) {
              singleStoreResult.item_ids = singleStoreResult.item_ids.split(",");
            });return _context5.abrupt("return",
            rows);case 14:_context5.prev = 14;_context5.t0 = _context5["catch"](0);

            _errorHandler["default"].handleError(_context5.t0, "sqlHelpers/getPayoutInfo");throw _context5.t0;case 18:case "end":return _context5.stop();}}}, _callee5, null, [[0, 14]]);}));return _getPayoutInfo.apply(this, arguments);}function




setStoreNotificationFlags(_x7) {return _setStoreNotificationFlags.apply(this, arguments);}function _setStoreNotificationFlags() {_setStoreNotificationFlags = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(itemIds) {var conn, _ref7, _ref8, storeIdResults, fields, storeIdsList;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:_context6.prev = 0;_context6.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context6.sent;_context6.next = 6;return (


              conn.query(
              "SELECT store_id FROM items WHERE item_id IN (?)",
              [itemIds]));case 6:_ref7 = _context6.sent;_ref8 = _slicedToArray(_ref7, 2);storeIdResults = _ref8[0];fields = _ref8[1];
            storeIdsList = storeIdResults.map(function (storeIdResult) {return storeIdResult.store_id;});

            // Set needs_notification to 1
            _context6.next = 13;return conn.query(
            "UPDATE stores SET needs_notification=1 WHERE store_id IN (?)",
            [storeIdsList]);case 13:
            console.log("Notification flag updated sucessfully for stores: ".concat(storeIdsList));_context6.next = 20;break;case 16:_context6.prev = 16;_context6.t0 = _context6["catch"](0);

            _errorHandler["default"].handleError(_context6.t0, "sqlHelpers/setStoreNotificationFlags");throw _context6.t0;case 20:case "end":return _context6.stop();}}}, _callee6, null, [[0, 16]]);}));return _setStoreNotificationFlags.apply(this, arguments);}var _default =




{
  insertMessageIntoDB: insertMessageIntoDB,
  markItemAsDonated: markItemAsDonated,
  getFBMessengerInfoFromItemId: getFBMessengerInfoFromItemId,
  insertDonationIntoDB: insertDonationIntoDB,
  getPayoutInfo: getPayoutInfo,
  setStoreNotificationFlags: setStoreNotificationFlags };exports["default"] = _default;