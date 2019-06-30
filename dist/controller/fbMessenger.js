"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));
var _fbHelpers = _interopRequireDefault(require("../util/fbHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };} // Imports
require("dotenv").config();
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
}


function sendTestPickupNotification(req, res) {
  var itemId = req.body.itemId;
  try {
    _fbHelpers["default"].sendPickupNotification(itemId);
    res.status(200).send();
  } catch (e) {
    _errorHandler["default"].handleError(e, "fbMessenger/sendTestPickupNotification");
    res.status(500).send();
  }
}var _default =

{
  fbAuth: fbAuth,
  sendTestPickupNotification: sendTestPickupNotification,
  processFBMessage: processFBMessage };exports["default"] = _default;