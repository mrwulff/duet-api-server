"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var conn = _config["default"].dbInitConnect(); // SQL
var messenger = _config["default"].fbMessengerInit(); // FB Messenger

// Adds support for GET requests to our webhook
function fbAuth(req, res) {

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

// Handles FB message events
// See: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
function processFBMessage(req, res) {

  // Parse the request body from the POST
  var body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      if (entry.messaging) {
        var message_obj = entry.messaging[0];
        console.log(message_obj);

        // Log message in SQL
        var sender = message_obj.sender.id;
        var recipient = message_obj.recipient.id;
        var message = message_obj.message.text;

        conn.query(
        "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
        ['fb', sender, recipient, message],
        function (err) {
          if (err) {
            console.log(err);
            res.status(500).send({ error: err });
          } else
          {
            console.log("Message logged to database");
            res.status(200).send();
          }
        });

      }
    });

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

function sendPickupNotification(itemId) {
  conn.query(
  "SELECT " +
  "items.name AS item_name, items.pickup_code, " +
  "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " +
  "stores.name AS store_name " +
  "FROM items " +
  "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " +
  "INNER JOIN stores ON items.store_id = stores.store_id " +
  "WHERE items.item_id=?",
  [itemId],
  function (err, rows) {
    if (err) {
      console.log(err);
      return false;
    } else if (rows.length == 0) {
      console.log("No matches found when sending pickup notification!");
      return false;
    } else {
      var message = "Hi " + rows[0].first_name + ", this is an automated message from Duet.\n" +
      "Your " + rows[0].item_name + " is now available for pickup from " + rows[0].store_name + "!\n" +
      "Please use pick-up code: " + rows[0].pickup_code;
      try {
        messenger.sendTextMessage({
          id: rows[0].fb_psid,
          text: message,
          messaging_type: "MESSAGE_TAG",
          tag: "SHIPPING_UPDATE" });

        console.log('Sent pickup notification to ' + rows[0].first_name + " " + rows[0].last_name +
        " for " + rows[0].item_name + " with itemId: " + itemId);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  });

}

// TODO: delete this after testing
function sendTestPickupNotification(req, res) {
  var itemId = req.body.itemId;
  try {
    sendPickupNotification(itemId);
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
  res.status(200).send();
}var _default =

{ fbAuth: fbAuth, sendTestPickupNotification: sendTestPickupNotification, sendPickupNotification: sendPickupNotification, processFBMessage: processFBMessage };exports["default"] = _default;