// Imports
require("dotenv").config();
import config from '../util/config.js';
import sqlHelpers from '../util/sqlHelpers.js';
const conn = config.dbInitConnect(); // SQL
const messenger = config.fbMessengerInit(); // FB Messenger

// Adds support for GET requests to our webhook
function fbAuth(req, res) {

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

// Handles FB message events
// See: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
function processFBMessage(req, res) {

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
        (err, rows) => {
            if (err) {
                console.log(err);
                return false;
            } else if (rows.length == 0) {
                console.log("No matches found when sending pickup notification!");
                return false;
            } else {
                let message = "Hi " + rows[0].first_name + ", this is an automated message from Duet.\n" +
                    "Your " + rows[0].item_name + " is now available for pickup from " + rows[0].store_name + "!\n" +
                    "Please use pick-up code: " + rows[0].pickup_code;
                try {
                    messenger.sendTextMessage({
                        id: rows[0].fb_psid,
                        text: message,
                        messaging_type: "MESSAGE_TAG",
                        tag: "SHIPPING_UPDATE"
                    });
                    console.log('Sent pickup notification to ' + rows[0].first_name + " " + rows[0].last_name +
                        " for " + rows[0].item_name + " with itemId: " + itemId);
                    return true;
                } catch (e) {
                    console.error(e);
                    return false;
                }
            }
        }
    );
}

// TODO: delete this after testing
function sendTestPickupNotification(req, res) {
    let itemId = req.body.itemId;
    try {
        sendPickupNotification(itemId);
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: e });
    }
    res.status(200).send();
}

export default { fbAuth, sendTestPickupNotification, sendPickupNotification, processFBMessage };