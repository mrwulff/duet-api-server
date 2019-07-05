"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _sendgridHelpers = _interopRequireDefault(require("./sendgridHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

// Standard error handler: console log, and send us an email
function handleError(err) {var functionName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  try {
    if (functionName) {
      console.log("Error in " + functionName + ": " + err);
      _sendgridHelpers["default"].sendErrorEmail(err, functionName);
    } else
    {
      console.log(err);
      _sendgridHelpers["default"].sendErrorEmail(err, "unknownFunction");
    }
  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err);
  }
};var _default =

{
  handleError: handleError };exports["default"] = _default;