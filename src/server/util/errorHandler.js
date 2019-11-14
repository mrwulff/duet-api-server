import sendgridHelpers from "./sendgridHelpers.js";
require("dotenv").config();
const rp = require('request-promise');


// Standard error handler: console log, and send us a slack message
async function handleError(err, functionName = false) {
  try {
      console.log(err.stack);

      if (process.env.NODE_ENV == 'production') {
        await rp({
          method: 'POST',
          uri: process.env.SLACK_PROD_ERROR_WEBHOOK,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            text: err.stack
          },
          json: true
        });
      } else if (process.env.NODE_ENV == 'staging') {
        await rp({
          method: 'POST',
          uri: process.env.SLACK_STAGING_ERROR_WEBHOOK,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            text: err.stack
          },
          json: true
        });
      }
  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err.toString());
  }
};

export default {
  handleError
};
