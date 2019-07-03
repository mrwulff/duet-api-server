"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();
// -------------------- FACEBOOK MESSENGER -------------------- //

// Insert message into database
function insertMessageIntoDB(_x) {return _insertMessageIntoDB.apply(this, arguments);}


















// Get all info necessary to send a pickup notification
function _insertMessageIntoDB() {_insertMessageIntoDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message) {var source, sender, recipient, content, conn;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:source = message['source'];sender = message['sender'];recipient = message['recipient'];content = message['content'];_context.prev = 4;_context.next = 7;return _config["default"].dbInitConnectPromise();case 7:conn = _context.sent;_context.next = 10;return conn.query("INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)", [source, sender, recipient, content]);case 10:console.log("Successfully inserted message into database: %j", message);_context.next = 17;break;case 13:_context.prev = 13;_context.t0 = _context["catch"](4);_errorHandler["default"].handleError(_context.t0, "sqlHelper/insertMessageIntoDB");throw _context.t0;case 17:case "end":return _context.stop();}}}, _callee, null, [[4, 13]]);}));return _insertMessageIntoDB.apply(this, arguments);}function getFBMessengerInfoFromItemId(_x2) {return _getFBMessengerInfoFromItemId.apply(this, arguments);}


























// -------------------- DONATIONS -------------------- //
function _getFBMessengerInfoFromItemId() {_getFBMessengerInfoFromItemId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(itemId) {var conn, _ref, _ref2, rows, fields;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context2.sent;_context2.next = 6;return conn.query("SELECT " + "items.name AS item_name, items.pickup_code, " + "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " + "stores.name AS store_name " + "FROM items " + "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " + "INNER JOIN stores ON items.store_id = stores.store_id " + "WHERE items.item_id=?", [itemId]);case 6:_ref = _context2.sent;_ref2 = _slicedToArray(_ref, 2);rows = _ref2[0];fields = _ref2[1];if (!(rows.length === 0)) {_context2.next = 15;break;}console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);return _context2.abrupt("return", null);case 15:return _context2.abrupt("return", rows[0]);case 16:_context2.next = 22;break;case 18:_context2.prev = 18;_context2.t0 = _context2["catch"](0);_errorHandler["default"].handleError(_context2.t0, "sqlHelper/getFBMessengerInfoFromItemId");throw _context2.t0;case 22:case "end":return _context2.stop();}}}, _callee2, null, [[0, 18]]);}));return _getFBMessengerInfoFromItemId.apply(this, arguments);}function
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




markItemAsDonated(_x4, _x5) {return _markItemAsDonated.apply(this, arguments);}













// -------------------- TYPEFORM -------------------- //
function _markItemAsDonated() {_markItemAsDonated = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(itemId, donationId) {var conn;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.prev = 0;_context4.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context4.sent;_context4.next = 6;return conn.query("UPDATE items SET status='PAID', in_notification=1, donation_id=? WHERE item_id=?", [donationId, itemId]);case 6:_context4.next = 12;break;case 8:_context4.prev = 8;_context4.t0 = _context4["catch"](0);_errorHandler["default"].handleError(_context4.t0, "sqlHelpers/markItemAsDoanted");throw _context4.t0;case 12:case "end":return _context4.stop();}}}, _callee4, null, [[0, 8]]);}));return _markItemAsDonated.apply(this, arguments);}function
insertItemFromTypeform(_x6) {return _insertItemFromTypeform.apply(this, arguments);}function _insertItemFromTypeform() {_insertItemFromTypeform = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(itemInfo) {var conn, _ref5, _ref6, results, fields;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.prev = 0;_context5.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context5.sent;_context5.next = 6;return (
              conn.query(
              "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link,in_notification) " +
              "VALUES (?,?,?,?,?,?,?,?)",
              [itemInfo.itemNameEnglish,
              itemInfo.size,
              itemInfo.price,
              itemInfo.beneficiaryId,
              itemInfo.categoryId,
              itemInfo.storeId,
              itemInfo.photoUrl,
              itemInfo.in_notification]));case 6:_ref5 = _context5.sent;_ref6 = _slicedToArray(_ref5, 2);results = _ref6[0];fields = _ref6[1];return _context5.abrupt("return",

            results.insertId);case 13:_context5.prev = 13;_context5.t0 = _context5["catch"](0);

            _errorHandler["default"].handleError(_context5.t0, "sqlHelpers/insertItemFromTypeform");throw _context5.t0;case 17:case "end":return _context5.stop();}}}, _callee5, null, [[0, 13]]);}));return _insertItemFromTypeform.apply(this, arguments);}function




updateItemPickupCode(_x7, _x8) {return _updateItemPickupCode.apply(this, arguments);}function _updateItemPickupCode() {_updateItemPickupCode = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(itemId, pickupCode) {var conn;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:_context6.prev = 0;_context6.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context6.sent;_context6.next = 6;return (
              conn.query(
              "UPDATE items SET pickup_code=? WHERE item_id=?",
              [pickupCode, itemId]));case 6:_context6.next = 12;break;case 8:_context6.prev = 8;_context6.t0 = _context6["catch"](0);


            _errorHandler["default"].handleError(_context6.t0, "sqlHelpers/updateItemPickupCode");throw _context6.t0;case 12:case "end":return _context6.stop();}}}, _callee6, null, [[0, 8]]);}));return _updateItemPickupCode.apply(this, arguments);}function




updateItemPhotoLink(_x9, _x10) {return _updateItemPhotoLink.apply(this, arguments);}function _updateItemPhotoLink() {_updateItemPhotoLink = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(itemId, photoUrl) {var conn;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:_context7.prev = 0;_context7.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context7.sent;_context7.next = 6;return (
              conn.query(
              "UPDATE items SET link=? WHERE item_id=?",
              [photoUrl, itemId]));case 6:_context7.next = 12;break;case 8:_context7.prev = 8;_context7.t0 = _context7["catch"](0);


            _errorHandler["default"].handleError(_context7.t0, "sqlHelpers/updateItemPhotoLink");throw _context7.t0;case 12:case "end":return _context7.stop();}}}, _callee7, null, [[0, 8]]);}));return _updateItemPhotoLink.apply(this, arguments);}function




getItemNameTranslation(_x11, _x12) {return _getItemNameTranslation.apply(this, arguments);}














// -------------------- PAYPAL -------------------- //
function _getItemNameTranslation() {_getItemNameTranslation = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(language, itemName) {var conn, _ref7, _ref8, matchedItemNames, fields;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:_context8.prev = 0;_context8.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context8.sent;_context8.next = 6;return conn.query("SELECT name_english, category_id FROM item_types WHERE ?? LIKE ?", ["name_" + language, "%" + itemName + "%"]);case 6:_ref7 = _context8.sent;_ref8 = _slicedToArray(_ref7, 2);matchedItemNames = _ref8[0];fields = _ref8[1];return _context8.abrupt("return", matchedItemNames[0]);case 13:_context8.prev = 13;_context8.t0 = _context8["catch"](0);_errorHandler["default"].handleError(_context8.t0, "sqlHelpers/getItemNameTranslation");throw _context8.t0;case 17:case "end":return _context8.stop();}}}, _callee8, null, [[0, 13]]);}));return _getItemNameTranslation.apply(this, arguments);}function getPayoutInfo(_x13) {return _getPayoutInfo.apply(this, arguments);}































// -------------------- STORES -------------------- //
function _getPayoutInfo() {_getPayoutInfo = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(itemIds) {var conn, _ref9, _ref10, rows, fields;return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:_context9.prev = 0;_context9.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context9.sent;_context9.next = 6;return conn.query("SELECT stores.paypal AS paypal, " + "payouts.payment_amount AS payment_amount, " + "payouts.item_ids AS item_ids " + "FROM stores AS stores " + "INNER JOIN (" + "SELECT store_id, " + "SUM(price_euros) AS payment_amount, " + "GROUP_CONCAT(item_id) AS item_ids " + "FROM items " + "WHERE item_id IN (?) " + "GROUP BY store_id" + ") AS payouts " + "USING(store_id) " + "WHERE stores.payment_method = 'paypal'", [itemIds]);case 6:_ref9 = _context9.sent;_ref10 = _slicedToArray(_ref9, 2);rows = _ref10[0];fields = _ref10[1]; // convert item_ids from string to list
            rows.forEach(function (singleStoreResult) {singleStoreResult.item_ids = singleStoreResult.item_ids.split(",");});return _context9.abrupt("return", rows);case 14:_context9.prev = 14;_context9.t0 = _context9["catch"](0);_errorHandler["default"].handleError(_context9.t0, "sqlHelpers/getPayoutInfo");throw _context9.t0;case 18:case "end":return _context9.stop();}}}, _callee9, null, [[0, 14]]);}));return _getPayoutInfo.apply(this, arguments);}function getStoreIdFromName(_x14) {return _getStoreIdFromName.apply(this, arguments);}function _getStoreIdFromName() {_getStoreIdFromName = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(storeName) {var conn, _ref11, _ref12, results, fields;return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:_context10.prev = 0;_context10.next = 3;return (
              _config["default"].dbInitConnectPromise());case 3:conn = _context10.sent;_context10.next = 6;return (
              conn.query("SELECT store_id FROM stores WHERE name=?", [storeName]));case 6:_ref11 = _context10.sent;_ref12 = _slicedToArray(_ref11, 2);results = _ref12[0];fields = _ref12[1];return _context10.abrupt("return",
            results[0].store_id);case 13:_context10.prev = 13;_context10.t0 = _context10["catch"](0);

            _errorHandler["default"].handleError(_context10.t0, "sqlHelpers/getStoreIdFromName");throw _context10.t0;case 17:case "end":return _context10.stop();}}}, _callee10, null, [[0, 13]]);}));return _getStoreIdFromName.apply(this, arguments);}function




getStoreInfoFromEmail(_x15) {return _getStoreInfoFromEmail.apply(this, arguments);}function _getStoreInfoFromEmail() {_getStoreInfoFromEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(email) {var conn, _ref13, _ref14, results, fields;return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:_context11.prev = 0;_context11.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context11.sent;_context11.next = 6;return (
              conn.query(
              "SELECT store_id, name, email FROM stores WHERE email=?",
              [email]));case 6:_ref13 = _context11.sent;_ref14 = _slicedToArray(_ref13, 2);results = _ref14[0];fields = _ref14[1];if (!(

            results.length === 0)) {_context11.next = 14;break;}return _context11.abrupt("return",
            null);case 14:return _context11.abrupt("return",

            results[0]);case 15:_context11.next = 21;break;case 17:_context11.prev = 17;_context11.t0 = _context11["catch"](0);


            _errorHandler["default"].handleError(_context11.t0, "sqlHelpers/getStoreInfoFromEmail");throw _context11.t0;case 21:case "end":return _context11.stop();}}}, _callee11, null, [[0, 17]]);}));return _getStoreInfoFromEmail.apply(this, arguments);}function




getStoresThatNeedNotification() {return _getStoresThatNeedNotification.apply(this, arguments);}function _getStoresThatNeedNotification() {_getStoresThatNeedNotification = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {var conn, _ref15, _ref16, results, fields;return regeneratorRuntime.wrap(function _callee12$(_context12) {while (1) {switch (_context12.prev = _context12.next) {case 0:_context12.prev = 0;_context12.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context12.sent;_context12.next = 6;return (
              conn.query("SELECT * from stores where needs_notification=1"));case 6:_ref15 = _context12.sent;_ref16 = _slicedToArray(_ref15, 2);results = _ref16[0];fields = _ref16[1];return _context12.abrupt("return",
            results);case 13:_context12.prev = 13;_context12.t0 = _context12["catch"](0);

            _errorHandler["default"].handleError(_context12.t0, "sqlHelpers/getStoresThatNeedNotification");throw _context12.t0;case 17:case "end":return _context12.stop();}}}, _callee12, null, [[0, 13]]);}));return _getStoresThatNeedNotification.apply(this, arguments);}function




setStoreNotificationFlags(_x16) {return _setStoreNotificationFlags.apply(this, arguments);}function _setStoreNotificationFlags() {_setStoreNotificationFlags = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(itemIds) {var conn, _ref17, _ref18, storeIdResults, fields, storeIdsList;return regeneratorRuntime.wrap(function _callee13$(_context13) {while (1) {switch (_context13.prev = _context13.next) {case 0:_context13.prev = 0;_context13.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context13.sent;_context13.next = 6;return (


              conn.query(
              "SELECT store_id FROM items WHERE item_id IN (?)",
              [itemIds]));case 6:_ref17 = _context13.sent;_ref18 = _slicedToArray(_ref17, 2);storeIdResults = _ref18[0];fields = _ref18[1];
            storeIdsList = storeIdResults.map(function (storeIdResult) {return storeIdResult.store_id;});

            // Set needs_notification to 1
            _context13.next = 13;return conn.query(
            "UPDATE stores SET needs_notification=1 WHERE store_id IN (?)",
            [storeIdsList]);case 13:
            console.log("Notification flag updated sucessfully for stores: ".concat(storeIdsList));_context13.next = 20;break;case 16:_context13.prev = 16;_context13.t0 = _context13["catch"](0);

            _errorHandler["default"].handleError(_context13.t0, "sqlHelpers/setStoreNotificationFlags");throw _context13.t0;case 20:case "end":return _context13.stop();}}}, _callee13, null, [[0, 16]]);}));return _setStoreNotificationFlags.apply(this, arguments);}function




setSingleStoreNotificationFlag(_x17) {return _setSingleStoreNotificationFlag.apply(this, arguments);}function _setSingleStoreNotificationFlag() {_setSingleStoreNotificationFlag = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(storeId) {var conn;return regeneratorRuntime.wrap(function _callee14$(_context14) {while (1) {switch (_context14.prev = _context14.next) {case 0:_context14.prev = 0;_context14.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context14.sent;_context14.next = 6;return (
              conn.query("UPDATE stores SET needs_notification=true where store_id=?",
              [storeId]));case 6:_context14.next = 12;break;case 8:_context14.prev = 8;_context14.t0 = _context14["catch"](0);


            _errorHandler["default"].handleError(_context14.t0);throw _context14.t0;case 12:case "end":return _context14.stop();}}}, _callee14, null, [[0, 8]]);}));return _setSingleStoreNotificationFlag.apply(this, arguments);}function




resetStoreNotificationFlags() {return _resetStoreNotificationFlags.apply(this, arguments);}function _resetStoreNotificationFlags() {_resetStoreNotificationFlags = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15() {var conn;return regeneratorRuntime.wrap(function _callee15$(_context15) {while (1) {switch (_context15.prev = _context15.next) {case 0:_context15.prev = 0;_context15.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context15.sent;_context15.next = 6;return (
              conn.query("UPDATE stores SET needs_notification=0"));case 6:_context15.next = 12;break;case 8:_context15.prev = 8;_context15.t0 = _context15["catch"](0);

            _errorHandler["default"].handleError(_context15.t0, "sqlHelpers/resetStoreNotificationFlags");throw _context15.t0;case 12:case "end":return _context15.stop();}}}, _callee15, null, [[0, 8]]);}));return _resetStoreNotificationFlags.apply(this, arguments);}function




getItemsForNotificationEmail(_x18) {return _getItemsForNotificationEmail.apply(this, arguments);}function _getItemsForNotificationEmail() {_getItemsForNotificationEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(store_id) {var conn, updatedItems, _ref19, _ref20, results, fields, item;return regeneratorRuntime.wrap(function _callee16$(_context16) {while (1) {switch (_context16.prev = _context16.next) {case 0:_context16.prev = 0;_context16.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context16.sent;
            updatedItems = [];_context16.next = 7;return (
              conn.query("SELECT * from items where store_id=? and in_notification=1",

              [store_id]));case 7:_ref19 = _context16.sent;_ref20 = _slicedToArray(_ref19, 2);results = _ref20[0];fields = _ref20[1];

            if (results.length === 0) {
              console.log("sqlHelpers/getItemsForNotificationEmail: No items included in notification");
            } else
            {

              results.forEach(function (obj) {
                item = {
                  itemId: obj.item_id,
                  itemImage: obj.link,
                  itemName: obj.name,
                  itemPrice: obj.price_euros };

                updatedItems.push(item);
              });
            }return _context16.abrupt("return",
            updatedItems);case 15:_context16.prev = 15;_context16.t0 = _context16["catch"](0);

            _errorHandler["default"].handleError(_context16.t0, "sqlHelpers/getItemsForNotificationEmail");throw _context16.t0;case 19:case "end":return _context16.stop();}}}, _callee16, null, [[0, 15]]);}));return _getItemsForNotificationEmail.apply(this, arguments);}function




unsetItemsNotificationFlag(_x19) {return _unsetItemsNotificationFlag.apply(this, arguments);}













// -------------------- BENEFICIARIES -------------------- //
function _unsetItemsNotificationFlag() {_unsetItemsNotificationFlag = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(item_ids) {var conn;return regeneratorRuntime.wrap(function _callee17$(_context17) {while (1) {switch (_context17.prev = _context17.next) {case 0:_context17.prev = 0;_context17.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context17.sent;_context17.next = 6;return conn.query("UPDATE items SET in_notification=0 where item_id IN (?)", [item_ids]);case 6:_context17.next = 12;break;case 8:_context17.prev = 8;_context17.t0 = _context17["catch"](0);_errorHandler["default"].handleError(_context17.t0, "sqlHelpers/unsetItemsNotificationFlag");throw _context17.t0;case 12:case "end":return _context17.stop();}}}, _callee17, null, [[0, 8]]);}));return _unsetItemsNotificationFlag.apply(this, arguments);}function getBeneficiaryInfo(_x20) {return _getBeneficiaryInfo.apply(this, arguments);}function _getBeneficiaryInfo() {_getBeneficiaryInfo = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(beneficiaryId) {var conn, _ref21, _ref22, results, fields;return regeneratorRuntime.wrap(function _callee18$(_context18) {while (1) {switch (_context18.prev = _context18.next) {case 0:_context18.prev = 0;_context18.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context18.sent;_context18.next = 6;return (
              conn.query(
              "SELECT beneficiary_id, first_name, last_name, story, " +
              "origin_city, origin_country, current_city, current_country, family_image_url " +
              "FROM beneficiaries WHERE beneficiary_id = ?",
              [beneficiaryId]));case 6:_ref21 = _context18.sent;_ref22 = _slicedToArray(_ref21, 2);results = _ref22[0];fields = _ref22[1];if (!(

            results.length === 0)) {_context18.next = 12;break;}return _context18.abrupt("return",
            null);case 12:return _context18.abrupt("return",

            results[0]);case 15:_context18.prev = 15;_context18.t0 = _context18["catch"](0);

            _errorHandler["default"].handleError(_context18.t0, "sqlHelpers/getBeneficiaryInfo");throw _context18.t0;case 19:case "end":return _context18.stop();}}}, _callee18, null, [[0, 15]]);}));return _getBeneficiaryInfo.apply(this, arguments);}function




getBeneficiaryNeeds(_x21) {return _getBeneficiaryNeeds.apply(this, arguments);}function _getBeneficiaryNeeds() {_getBeneficiaryNeeds = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(beneficiaryId) {var conn, _ref23, _ref24, results, fields;return regeneratorRuntime.wrap(function _callee19$(_context19) {while (1) {switch (_context19.prev = _context19.next) {case 0:_context19.prev = 0;_context19.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context19.sent;_context19.next = 6;return (
              conn.query(
              "SELECT item_id, link, items.name, pickup_code, price_euros, " +
              "status, store_id, icon_url, " +
              "stores.name as store_name, stores.google_maps as store_maps_link, " +
              "donations.timestamp as donation_timestamp " +
              "FROM items " +
              "INNER JOIN categories USING(category_id) " +
              "INNER JOIN stores USING(store_id) " +
              "LEFT JOIN donations USING(donation_id)" +
              "WHERE beneficiary_id = ?",
              [beneficiaryId]));case 6:_ref23 = _context19.sent;_ref24 = _slicedToArray(_ref23, 2);results = _ref24[0];fields = _ref24[1];return _context19.abrupt("return",

            results);case 13:_context19.prev = 13;_context19.t0 = _context19["catch"](0);

            _errorHandler["default"].handleError(_context19.t0, "sqlHelpers/getBeneficiaryInfo");throw _context19.t0;case 17:case "end":return _context19.stop();}}}, _callee19, null, [[0, 13]]);}));return _getBeneficiaryNeeds.apply(this, arguments);}function




getAllBeneficiaryInfoAndNeeds() {return _getAllBeneficiaryInfoAndNeeds.apply(this, arguments);}


















// -------------------- ITEMS -------------------- //
function _getAllBeneficiaryInfoAndNeeds() {_getAllBeneficiaryInfoAndNeeds = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {var conn, _ref25, _ref26, results, fields;return regeneratorRuntime.wrap(function _callee20$(_context20) {while (1) {switch (_context20.prev = _context20.next) {case 0:_context20.prev = 0;_context20.next = 3;return _config["default"].dbInitConnectPromise();case 3:conn = _context20.sent;_context20.next = 6;return conn.query("SELECT beneficiary_id, first_name, last_name, story, " + "origin_city, origin_country, current_city, current_country, family_image_url, " + "item_id, link, items.name, pickup_code, price_euros, status, store_id, icon_url, " + "stores.name AS store_name, donations.timestamp AS donation_timestamp " + "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " + "INNER JOIN stores USING(store_id) LEFT JOIN donations USING(donation_id) ORDER BY beneficiary_id");case 6:_ref25 = _context20.sent;_ref26 = _slicedToArray(_ref25, 2);results = _ref26[0];fields = _ref26[1];return _context20.abrupt("return", results);case 13:_context20.prev = 13;_context20.t0 = _context20["catch"](0);_errorHandler["default"].handleError(_context20.t0, "sqlHelpers/getAllBeneficiaryInfoAndNeeds");throw _context20.t0;case 17:case "end":return _context20.stop();}}}, _callee20, null, [[0, 13]]);}));return _getAllBeneficiaryInfoAndNeeds.apply(this, arguments);}var itemsQuery =
"SELECT item_id, size, link, items.name, pickup_code, price_euros, " +
"status, store_id, icon_url, " +
"stores.name as store_name, stores.google_maps as store_maps_link, " +
"beneficiary_id, beneficiaries.first_name as beneficiary_first, beneficiaries.last_name as beneficiary_last, " +
"donations.timestamp as donation_timestamp " +
"FROM items " +
"INNER JOIN categories USING(category_id) " +
"INNER JOIN stores USING(store_id) " +
"INNER JOIN beneficiaries USING(beneficiary_id) " +
"LEFT JOIN donations USING(donation_id)";function

getItem(_x22) {return _getItem.apply(this, arguments);}function _getItem() {_getItem = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(itemId) {var conn, _ref27, _ref28, results, fields;return regeneratorRuntime.wrap(function _callee21$(_context21) {while (1) {switch (_context21.prev = _context21.next) {case 0:_context21.prev = 0;_context21.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context21.sent;_context21.next = 6;return (
              conn.query(
              itemsQuery + " WHERE item_id=?",
              [itemId]));case 6:_ref27 = _context21.sent;_ref28 = _slicedToArray(_ref27, 2);results = _ref28[0];fields = _ref28[1];if (!(

            results.length === 0)) {_context21.next = 14;break;}return _context21.abrupt("return",
            null);case 14:return _context21.abrupt("return",


            results[0]);case 15:_context21.next = 21;break;case 17:_context21.prev = 17;_context21.t0 = _context21["catch"](0);


            _errorHandler["default"].handleError(_context21.t0, "sqlHelpers/getItem");throw _context21.t0;case 21:case "end":return _context21.stop();}}}, _callee21, null, [[0, 17]]);}));return _getItem.apply(this, arguments);}function




getItemsForStore(_x23) {return _getItemsForStore.apply(this, arguments);}function _getItemsForStore() {_getItemsForStore = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(storeId) {var conn, _ref29, _ref30, results, fields;return regeneratorRuntime.wrap(function _callee22$(_context22) {while (1) {switch (_context22.prev = _context22.next) {case 0:_context22.prev = 0;_context22.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context22.sent;_context22.next = 6;return (
              conn.query(
              itemsQuery + " WHERE store_id=?",
              [storeId]));case 6:_ref29 = _context22.sent;_ref30 = _slicedToArray(_ref29, 2);results = _ref30[0];fields = _ref30[1];return _context22.abrupt("return",

            results);case 13:_context22.prev = 13;_context22.t0 = _context22["catch"](0);

            _errorHandler["default"].handleError(_context22.t0, "sqlHelpers/getItemsForStore");throw _context22.t0;case 17:case "end":return _context22.stop();}}}, _callee22, null, [[0, 13]]);}));return _getItemsForStore.apply(this, arguments);}function




getAllItems() {return _getAllItems.apply(this, arguments);}function _getAllItems() {_getAllItems = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23() {var conn, _ref31, _ref32, results, fields;return regeneratorRuntime.wrap(function _callee23$(_context23) {while (1) {switch (_context23.prev = _context23.next) {case 0:_context23.prev = 0;_context23.next = 3;return (


              _config["default"].dbInitConnectPromise());case 3:conn = _context23.sent;_context23.next = 6;return (
              conn.query(
              itemsQuery));case 6:_ref31 = _context23.sent;_ref32 = _slicedToArray(_ref31, 2);results = _ref32[0];fields = _ref32[1];if (!(

            results.length === 0)) {_context23.next = 14;break;}return _context23.abrupt("return",
            null);case 14:return _context23.abrupt("return",


            results);case 15:_context23.next = 21;break;case 17:_context23.prev = 17;_context23.t0 = _context23["catch"](0);


            _errorHandler["default"].handleError(_context23.t0, "sqlHelpers/getAllItems");throw _context23.t0;case 21:case "end":return _context23.stop();}}}, _callee23, null, [[0, 17]]);}));return _getAllItems.apply(this, arguments);}function




updateItemStatus(_x24, _x25) {return _updateItemStatus.apply(this, arguments);}function _updateItemStatus() {_updateItemStatus = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24(newStatus, itemId) {var conn;return regeneratorRuntime.wrap(function _callee24$(_context24) {while (1) {switch (_context24.prev = _context24.next) {case 0:_context24.prev = 0;_context24.next = 3;return (

              _config["default"].dbInitConnectPromise());case 3:conn = _context24.sent;if (!(
            newStatus === "PAID")) {_context24.next = 9;break;}_context24.next = 7;return (
              conn.query("UPDATE items SET status=?, in_notification=1 WHERE item_id = ?",

              [newStatus, itemId]));case 7:_context24.next = 11;break;case 9:_context24.next = 11;return (


              conn.query("UPDATE items SET status=? WHERE item_id = ?",

              [newStatus, itemId]));case 11:


            console.log("Successfully updated item status to " + newStatus + " for item " + itemId);_context24.next = 18;break;case 14:_context24.prev = 14;_context24.t0 = _context24["catch"](0);

            _errorHandler["default"].handleError(_context24.t0, "sqlHelpers/updateItemStatus");throw _context24.t0;case 18:case "end":return _context24.stop();}}}, _callee24, null, [[0, 14]]);}));return _updateItemStatus.apply(this, arguments);}var _default =




{
  // FACEBOOK MESSENGER
  insertMessageIntoDB: insertMessageIntoDB,
  getFBMessengerInfoFromItemId: getFBMessengerInfoFromItemId,

  // DONATIONS
  markItemAsDonated: markItemAsDonated,
  insertDonationIntoDB: insertDonationIntoDB,

  // TYPEFORM
  getItemNameTranslation: getItemNameTranslation,
  insertItemFromTypeform: insertItemFromTypeform,
  updateItemPickupCode: updateItemPickupCode,
  updateItemPhotoLink: updateItemPhotoLink,

  // PAYPAL
  getPayoutInfo: getPayoutInfo,

  // STORES
  getStoreIdFromName: getStoreIdFromName,
  getStoreInfoFromEmail: getStoreInfoFromEmail,
  getStoresThatNeedNotification: getStoresThatNeedNotification,
  setStoreNotificationFlags: setStoreNotificationFlags,
  setSingleStoreNotificationFlag: setSingleStoreNotificationFlag,
  resetStoreNotificationFlags: resetStoreNotificationFlags,
  getItemsForNotificationEmail: getItemsForNotificationEmail,
  unsetItemsNotificationFlag: unsetItemsNotificationFlag,

  // BENEFICIARIES
  getBeneficiaryInfo: getBeneficiaryInfo,
  getBeneficiaryNeeds: getBeneficiaryNeeds,
  getAllBeneficiaryInfoAndNeeds: getAllBeneficiaryInfoAndNeeds,

  // ITEMS
  getItem: getItem,
  getItemsForStore: getItemsForStore,
  getAllItems: getAllItems,
  updateItemStatus: updateItemStatus };exports["default"] = _default;