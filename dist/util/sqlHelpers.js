"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();
// Insert message into database
function insertMessageIntoDB(_x) {return _insertMessageIntoDB.apply(this, arguments);}function _insertMessageIntoDB() {_insertMessageIntoDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message) {var source, sender, recipient, content, conn;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            source = message['source'];
            sender = message['sender'];
            recipient = message['recipient'];
            content = message['content'];_context.prev = 4;_context.next = 7;return (


              _config["default"].dbInitConnectPromise());case 7:conn = _context.sent;
            conn.execute(
            "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
            [source, sender, recipient, content]);

            console.log("Successfully inserted message into database: %j", message);_context.next = 16;break;case 12:_context.prev = 12;_context.t0 = _context["catch"](4);

            console.log("Error when inserting message into database: %j", message);
            console.log(_context.t0);case 16:case "end":return _context.stop();}}}, _callee, null, [[4, 12]]);}));return _insertMessageIntoDB.apply(this, arguments);}var _default =



{
  insertMessageIntoDB: insertMessageIntoDB };exports["default"] = _default;