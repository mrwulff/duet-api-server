"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _sqlHelpers = _interopRequireDefault(require("./sqlHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();var messenger = _config["default"].fbMessengerInit(); // FB Messenger
function
sendPickupNotification(_x) {return _sendPickupNotification.apply(this, arguments);}function _sendPickupNotification() {_sendPickupNotification = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId) {var fbMessengerInfo, message;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;_context.next = 3;return (


              _sqlHelpers["default"].getFBMessengerInfoFromItemId(itemId));case 3:fbMessengerInfo = _context.sent;
            message = "Hi " + fbMessengerInfo.first_name + ", this is an automated message from Duet.\n" +
            "Your " + fbMessengerInfo.item_name + " is now available for pickup from " + fbMessengerInfo.store_name + "!\n" +
            "Please use pick-up code: " + fbMessengerInfo.pickup_code;
            messenger.sendTextMessage({
              id: fbMessengerInfo.fb_psid,
              text: message,
              messaging_type: "MESSAGE_TAG",
              tag: "SHIPPING_UPDATE" });

            console.log('Sent pickup notification to ' + fbMessengerInfo.first_name + " " + fbMessengerInfo.last_name +
            " for " + fbMessengerInfo.item_name + " with itemId: " + itemId);_context.next = 13;break;case 9:_context.prev = 9;_context.t0 = _context["catch"](0);

            errorHandler.handleError(_context.t0, "fbHelpers/sendPickupNotification");throw _context.t0;case 13:case "end":return _context.stop();}}}, _callee, null, [[0, 9]]);}));return _sendPickupNotification.apply(this, arguments);}var _default =




{
  sendPickupNotification: sendPickupNotification };exports["default"] = _default;