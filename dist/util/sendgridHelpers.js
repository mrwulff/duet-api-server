"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _config = _interopRequireDefault(require("../util/config.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}require("dotenv").config();
var sgMail = _config["default"].sendgridInit(); // Sendgrid

function sendErrorEmail(err, functionName) {
  // Send error email to duet.giving@gmail.com
  var msg = {
    to: "duet.giving@gmail.com",
    from: "duet.giving@gmail.com",
    templateId: "d-baf6edabb26741189b2835f0f3c7258e",
    dynamic_template_data: {
      environment: process.env.DATABASE === "duet_db" ? "PROD" : "SANDBOX",
      functionName: functionName,
      error: err } };


  sgMail.
  send(msg).
  then(function () {
    console.log("Error message sent to duet.giving@gmail.com");
  })["catch"](
  function (error) {
    console.log("Error when sending error email (lol): " + error);
  });
}

function sendDonorThankYouEmail(donorInfo) {
  // Send donor thank-you email
  // Takes in donorInfo object with "email", "firstName" fields
  var msg = {
    to: donorInfo.email,
    from: "duet@giveduet.org",
    templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
    dynamic_template_data: {
      name: donorInfo.firstName } };



  sgMail.
  send(msg).
  then(function () {
    console.log("Donation confirmation sent ".concat(donorInfo.email, " to successfully."));
  })["catch"](
  function (error) {
    _errorHandler["default"].handleError(error, "sendgridHelpers/sendDonorThankYouEmail");
  });
}

function sendTypeformErrorEmail(typeformErrorInfo) {
  // Send error email if Typeform response can't get added to DB
  msg = {
    to: "duet.giving@gmail.com",
    from: "duet.giving@gmail.com",
    templateId: "d-6ecc5d7df32c4528b8527c248a212552",
    dynamic_template_data: {
      formTitle: typeformErrorInfo.formTitle,
      eventId: typeformErrorInfo.eventId,
      error: typeformErrorInfo.err } };


  sgMail.
  send(msg).
  then(function () {
    console.log("Sendgrid error message delived successfully.");
  })["catch"](
  function (error) {
    _errorHandler["default"].handleError(error, "sendgridHelpers/sendTypeformErrorEmail");
  });
}

function sendStoreNotificationEmail(storeNotificationInfo) {
  // Send store notification email
  var subject;
  if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
    subject = "[SANDBOX] Duet: The following items need your attention!";
  } else {
    subject = "Duet: The following items need your attention!";
  }

  var msg = {
    to: storeNotificationInfo.recipientList,
    from: "duet@giveduet.org",
    templateId: "d-435a092f0be54b07b5135799ac7dfb01",
    dynamic_template_data: {
      storeName: storeNotificationInfo.name,
      items: storeNotificationInfo.updatedItems,
      subject: subject } };



  sgMail.
  sendMultiple(msg).
  then(function () {
    console.log("Message delivered to ".concat(storeNotificationInfo.name, " at ").concat(storeNotificationInfo.email, " successfully."));
  })["catch"](
  function (error) {
    _errorHandler["default"].handleError(error, "sendgridHelpers/sendStoreNotificationEmail");
  });
}

function sendReadyForPickupEmail(itemResult) {
  // Send item status update email: READY_FOR_PICKUP
  var emailTemplateId = 'd-15967181f418425fa3510cb674b7f580';
  var msg = {
    to: "duet.giving@gmail.com",
    from: "duet.giving@gmail.com",
    templateId: emailTemplateId,
    dynamic_template_data: {
      itemName: itemResult.name,
      itemSize: itemResult.size,
      itemLink: itemResult.link,
      pickupCode: itemResult.pickup_code,
      refugeeName: "".concat(itemResult.beneficiary_first, " ").concat(itemResult.beneficiary_last),
      refugeeId: itemResult.beneficiary_id,
      storeName: itemResult.store_name } };



  sgMail.
  send(msg).
  then(function () {
    console.log("Item ready to be picked up message delivered to Duet successfully.");
  })["catch"](
  function (error) {
    _errorHandler["default"].handleError(error, "sendgridHelpers/sendPickupUpdateEmail");
  });
}

function sendItemPickedUpEmail(itemResult) {
  // Send item status update email: PICKED_UP
  var emailTemplateId = 'd-2e5e32e85d614b338e7e27d3eacccac3';
  var recipientList;
  var subject;
  if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "sandbox") {
    recipientList = ["duet.giving@gmail.com"];
    subject = "[SANDBOX] You've made a difference";
  } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" && itemResult.donor_email && itemResult.donor_first) {
    recipientList = [itemResult.donor_email, "duet.giving@gmail.com"];
    subject = "You've made a difference";
  } else {
    _errorHandler["default"].handleError("Unable to send itemPickedUpEmail! itemResult: " + JSON.stringify(itemResult), "sendgridHelpers/sendItemPickedUpEmail");
  }
  var msg = {
    to: recipientList,
    from: "duet@giveduet.org",
    templateId: emailTemplateId,
    dynamic_template_data: {
      subject: subject,
      item_name: itemResult.name,
      item_link: itemResult.link,
      donor_first: itemResult.donor_first,
      beneficiary_last: itemResult.beneficiary_last } };



  sgMail.
  send(msg).
  then(function () {
    console.log("Item pickup message delivered successfully.");
  })["catch"](
  function (error) {
    _errorHandler["default"].handleError(error, "sendgridHelpers/sendItemPickedUpEmail");
  });
}var _default =

{
  sendErrorEmail: sendErrorEmail,
  sendTypeformErrorEmail: sendTypeformErrorEmail,
  sendDonorThankYouEmail: sendDonorThankYouEmail,
  sendStoreNotificationEmail: sendStoreNotificationEmail,
  sendReadyForPickupEmail: sendReadyForPickupEmail,
  sendItemPickedUpEmail: sendItemPickedUpEmail };exports["default"] = _default;