// Imports
require("dotenv").config();
import config from '../util/config.js';
import sqlHelpers from './sqlHelpers.js';
const messenger = config.fbMessengerInit(); // FB Messenger

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
        errorHandler.handleError(err, "fbHelpers/sendPickupNotification");
        throw err;
    }
}

export default {
    sendPickupNotification
}