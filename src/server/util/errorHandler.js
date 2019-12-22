require("dotenv").config();
const rp = require('request-promise');

// Standard error handler: console log, and send us a slack message
async function handleError(err, functionName = 'unknownFunction') {
  try {
    console.log(functionName + ': ' + err.stack);

    // if in development, don't send a message
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // send slack message (either STAGING or PROD)
    await rp({
      method: 'POST',
      uri: process.env.SLACK_ERROR_WEBHOOK,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        text: (functionName + ': ' + err.stack)
      },
      json: true
    });

  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err.toString());
  }
};

export default {
  handleError
};
