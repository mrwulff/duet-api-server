import sendgridHelpers from "./sendgridHelpers.js";
require("dotenv").config();

// Standard error handler: console log, and send us an email
function handleError(err, functionName = false) {
  err = (typeof err === 'object') ? JSON.stringify(err) : err.toString();
  try {
    if (functionName) {
      console.log("Error in " + functionName + ": " + err);
      if (process.env.SEND_ERROR_EMAILS && process.env.SEND_ERROR_EMAILS === 'true') {
        sendgridHelpers.sendErrorEmail(err, functionName);
      }
    }
    else {
      console.log(err);
      if (process.env.SEND_ERROR_EMAILS && process.env.SEND_ERROR_EMAILS === 'true') {
        sendgridHelpers.sendErrorEmail(err, "unknownFunction");
      }
    }
  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err);
  }
};

export default {
  handleError
};