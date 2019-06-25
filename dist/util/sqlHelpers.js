"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();
// Insert message into database
function insertMessageIntoDB(_x) {return _insertMessageIntoDB.apply(this, arguments);}

















// Get all info necessary to send a pickup notification
function _insertMessageIntoDB() {_insertMessageIntoDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message) {var source, sender, recipient, content, conn;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:source = message['source'];sender = message['sender'];recipient = message['recipient'];content = message['content'];_context.prev = 4;_context.next = 7;return _config["default"].dbInitConnectPromise();case 7:conn = _context.sent;conn.query("INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)", [source, sender, recipient, content]);console.log("Successfully inserted message into database: %j", message);_context.next = 15;break;case 12:_context.prev = 12;_context.t0 = _context["catch"](4);_errorHandler["default"].handleError(_context.t0, "sqlHelper/insertMessageIntoDB");case 15:case "end":return _context.stop();}}}, _callee, null, [[4, 12]]);}));return _insertMessageIntoDB.apply(this, arguments);}function getFBMessengerInfoFromItemId(_x2) {return _getFBMessengerInfoFromItemId.apply(this, arguments);}function _getFBMessengerInfoFromItemId() {_getFBMessengerInfoFromItemId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(itemId) {var conn, _ref, _ref2, rows, fields;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return (

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


            rows[0]);case 16:_context2.next = 21;break;case 18:_context2.prev = 18;_context2.t0 = _context2["catch"](0);


            _errorHandler["default"].handleError(_context2.t0, "sqlHelper/getFBMessengerInfoFromItemId");case 21:case "end":return _context2.stop();}}}, _callee2, null, [[0, 18]]);}));return _getFBMessengerInfoFromItemId.apply(this, arguments);}var _default =




{
  insertMessageIntoDB: insertMessageIntoDB,
  getFBMessengerInfoFromItemId: getFBMessengerInfoFromItemId };exports["default"] = _default;