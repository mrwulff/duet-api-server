import sendgridHelpers from "./sendgridHelpers.js";
require("dotenv").config();

// Standard error handler: console log, and send us an email
function handleError(err, functionName = false) {
  try {
    if (functionName) {
      console.log("Error in " + functionName + ": " + err.toString());
      if (process.env.SEND_ERROR_EMAILS && process.env.SEND_ERROR_EMAILS === 'true') {
        sendgridHelpers.sendErrorEmail(err.toString(), functionName);
      }
    }
    else {
      console.log("Error in unknown function: " + err.toString());
      if (process.env.SEND_ERROR_EMAILS && process.env.SEND_ERROR_EMAILS === 'true') {
        sendgridHelpers.sendErrorEmail(err.toString(), "unknownFunction");
      }
    }
  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err.toString());
  }
};

export default {
  handleError
};