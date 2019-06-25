"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0; // Standard error handler
// TODO: send an email to duet.giving@gmail.com
function handleError(err, functionName) {
  if (functionName) {
    console.log("Error in " + functionName + ": " + err);
  } else
  {
    console.log(err);
  }
};var _default =

{
  handleError: handleError };exports["default"] = _default;