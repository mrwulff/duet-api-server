// Imports
import errorHandler from '../util/errorHandler.js';
import fbHelpers from '../util/fbHelpers.js';

function fbAuth(req, res) {
  // Adds support for GET requests to our webhook

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

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

async function processFBMessage(req, res) {
  // Handles FB message events
  // See: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
  // Parse the request body from the POST
  const body = req.body;
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    await Promise.all(body.entry.map(async entry => {
      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      if (entry.messaging) {
        const fb_message = entry.messaging[0];
        // Log message in SQL
        const message = {
          source: 'fb',
          sender: fb_message.sender.id,
          recipient: fb_message.recipient.id,
          content: fb_message.message.text,
          attachments: fb_message.message.attachments
        };
        try {
          await fbHelpers.insertMessageIntoDB(message);
        } catch (err) {
          console.log("Error when inserting message into SQL: " + err);
          return res.sendStatus(500);
        }
      }
    }));
    return res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    return res.sendStatus(404);
  }
}


function sendTestPickupNotification(req, res) {
  const itemId = req.body.itemId;
  try {
    fbHelpers.sendPickupNotification(itemId);
    res.status(200).send();
  } catch (e) {
    errorHandler.handleError(e, "fbMessenger/sendTestPickupNotification");
    res.status(500).send();
  }
}

export default {
  fbAuth,
  sendTestPickupNotification,
  processFBMessage
};