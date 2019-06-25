// Imports
require("dotenv").config();
import config from '../util/config.js';
import sqlHelpers from '../util/sqlHelpers.js';
import errorHandler from '../util/errorHandler.js'
const messenger = config.fbMessengerInit(); // FB Messenger

function fbAuth(req, res) {
    // Adds support for GET requests to our webhook

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

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
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Get the webhook event. entry.messaging is an array, but 
            // will only ever contain one event, so we get index 0
            if (entry.messaging) {
                let fb_message = entry.messaging[0];

                // Log message in SQL
                let message = {
                    source: 'fb',
                    sender: fb_message.sender.id,
                    recipient: fb_message.recipient.id,
                    content: fb_message.message.text
                }

                try {
                    sqlHelpers.insertMessageIntoDB(message);
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


async function sendPickupNotification(itemId) {
    // Send pickup notification for itemId
    try {
        let fbMessengerInfo = await sqlHelpers.getFBMessengerInfoFromItemId(itemId);
        let message = "Hi " + fbMessengerInfo.first_name + ", this is an automated message from Duet.\n" +
            "Your " + fbMessengerInfo.item_name + " is now available for pickup from " + fbMessengerInfo.store_name + "!\n" +
            "Please use pick-up code: " + fbMessengerInfo.pickup_code;
        messenger.sendTextMessage({
            id: fbMessengerInfo.fb_psid,
            text: message,
            messaging_type: "MESSAGE_TAG",
            tag: "SHIPPING_UPDATE"
        });
        console.log('Sent pickup notification to ' + fbMessengerInfo.first_name + " " + fbMessengerInfo.last_name +
            " for " + fbMessengerInfo.item_name + " with itemId: " + itemId);
    } catch (err) {
        errorHandler.handleError(err, "fbMessenger/sendPickupNotification");
    }
}

// TODO: delete this after testing
function sendTestPickupNotification(req, res) {
    let itemId = req.body.itemId;
    try {
        sendPickupNotification(itemId);
        res.status(200).send();
    } catch (e) {
        errorHandler.handleError(e, "fbMessenger/sendTestPickupNotification");
        res.status(500).send();
    }
}

export default { 
    fbAuth, 
    sendTestPickupNotification, 
    sendPickupNotification, 
    processFBMessage 
};