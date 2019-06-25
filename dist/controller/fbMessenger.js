"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();var messenger = _config["default"].fbMessengerInit(); // FB Messenger

function fbAuth(req, res) {
  // Adds support for GET requests to our webhook

  // Your verify token. Should be a random string.
  var VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  // Parse the query params
  var mode = req.query['hub.mode'];
  var token = req.query['hub.verify_token'];
  var challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};



function processFBMessage(req, res) {
  // Handles FB message events
  // See: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/

  // Parse the request body from the POST
  var body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      if (entry.messaging) {
        var fb_message = entry.messaging[0];

        // Log message in SQL
        var message = {
          source: 'fb',
          sender: fb_message.sender.id,
          recipient: fb_message.recipient.id,
          content: fb_message.message.text };


        try {
          _sqlHelpers["default"].insertMessageIntoDB(message);
          res.sendStatus(200);
        } catch (err) {
          console.log("Error when inserting message into SQL: " + err);
          res.sendStatus(500);
        }

      }
    });

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}function


sendPickupNotification(_x) {return _sendPickupNotification.apply(this, arguments);}



















// TODO: delete this after testing
function _sendPickupNotification() {_sendPickupNotification = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId) {var fbMessengerInfo, message;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;_context.next = 3;return _sqlHelpers["default"].getFBMessengerInfoFromItemId(itemId);case 3:fbMessengerInfo = _context.sent;message = "Hi " + fbMessengerInfo.first_name + ", this is an automated message from Duet.\n" + "Your " + fbMessengerInfo.item_name + " is now available for pickup from " + fbMessengerInfo.store_name + "!\n" + "Please use pick-up code: " + fbMessengerInfo.pickup_code;messenger.sendTextMessage({ id: fbMessengerInfo.fb_psid, text: message, messaging_type: "MESSAGE_TAG", tag: "SHIPPING_UPDATE" });console.log('Sent pickup notification to ' + fbMessengerInfo.first_name + " " + fbMessengerInfo.last_name + " for " + fbMessengerInfo.item_name + " with itemId: " + itemId);_context.next = 12;break;case 9:_context.prev = 9;_context.t0 = _context["catch"](0);_errorHandler["default"].handleError(_context.t0, "fbMessenger/sendPickupNotification");case 12:case "end":return _context.stop();}}}, _callee, null, [[0, 9]]);}));return _sendPickupNotification.apply(this, arguments);}function sendTestPickupNotification(req, res) {
  var itemId = req.body.itemId;
  try {
    sendPickupNotification(itemId);
    res.status(200).send();
  } catch (e) {
    _errorHandler["default"].handleError(e, "fbMessenger/sendTestPickupNotification");
    res.status(500).send();
  }
}var _default =

{
  fbAuth: fbAuth,
  sendTestPickupNotification: sendTestPickupNotification,
  sendPickupNotification: sendPickupNotification,
  processFBMessage: processFBMessage };exports["default"] = _default;