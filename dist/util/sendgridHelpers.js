"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _config = _interopRequireDefault(require("../util/config.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}require("dotenv").config();
var sgMail = _config["default"].sendgridInit(); // Sendgrid
function
sendErrorEmail(_x, _x2) {return _sendErrorEmail.apply(this, arguments);}function _sendErrorEmail() {_sendErrorEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(err, functionName) {var _msg;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;

            // Send error email to duet.giving@gmail.com
            _msg = {
              to: "duet.giving@gmail.com",
              from: "duet.giving@gmail.com",
              templateId: "d-baf6edabb26741189b2835f0f3c7258e",
              dynamic_template_data: {
                environment: process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" ? "PROD" : "SANDBOX",
                functionName: functionName,
                error: err } };_context.next = 4;return (


              sgMail.send(_msg));case 4:
            console.log("Error message sent to duet.giving@gmail.com");_context.next = 10;break;case 7:_context.prev = 7;_context.t0 = _context["catch"](0);

            console.log("Error when sending error email (lol): " + _context.t0);case 10:case "end":return _context.stop();}}}, _callee, null, [[0, 7]]);}));return _sendErrorEmail.apply(this, arguments);}function



sendDonorThankYouEmail(_x3) {return _sendDonorThankYouEmail.apply(this, arguments);}function _sendDonorThankYouEmail() {_sendDonorThankYouEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(donorInfo) {var _msg2;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;

            // Send donor thank-you email
            // Takes in donorInfo object with "email", "firstName" fields
            _msg2 = {
              to: ["duet.giving@gmail.com", donorInfo.email],
              from: "duet@giveduet.org",
              templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
              dynamic_template_data: {
                name: donorInfo.firstName,
                subject: process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" ? "Duet Donation Confirmation" : "[SANDBOX] Duet Donation Confirmation" } };_context2.next = 4;return (



              sgMail.sendMultiple(_msg2));case 4:
            console.log("Donation confirmation sent ".concat(donorInfo.email, " to successfully."));_context2.next = 10;break;case 7:_context2.prev = 7;_context2.t0 = _context2["catch"](0);

            _errorHandler["default"].handleError(error, "sendgridHelpers/sendDonorThankYouEmail");case 10:case "end":return _context2.stop();}}}, _callee2, null, [[0, 7]]);}));return _sendDonorThankYouEmail.apply(this, arguments);}function



sendTypeformErrorEmail(_x4) {return _sendTypeformErrorEmail.apply(this, arguments);}function _sendTypeformErrorEmail() {_sendTypeformErrorEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(typeformErrorInfo) {return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_context3.prev = 0;

            // Send error email if Typeform response can't get added to DB
            msg = {
              to: "duet.giving@gmail.com",
              from: "duet.giving@gmail.com",
              templateId: "d-6ecc5d7df32c4528b8527c248a212552",
              dynamic_template_data: {
                formTitle: typeformErrorInfo.formTitle,
                eventId: typeformErrorInfo.eventId,
                error: typeformErrorInfo.err } };_context3.next = 4;return (


              sgMail.send(msg));case 4:
            console.log("Sendgrid error message delived successfully.");_context3.next = 10;break;case 7:_context3.prev = 7;_context3.t0 = _context3["catch"](0);

            _errorHandler["default"].handleError(_context3.t0, "sendgridHelpers/sendTypeformErrorEmail");case 10:case "end":return _context3.stop();}}}, _callee3, null, [[0, 7]]);}));return _sendTypeformErrorEmail.apply(this, arguments);}function



sendStoreNotificationEmail(_x5) {return _sendStoreNotificationEmail.apply(this, arguments);}function _sendStoreNotificationEmail() {_sendStoreNotificationEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(storeNotificationInfo) {var subject, _msg3;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.prev = 0;

            // Send store notification email

            if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
              subject = "[SANDBOX] Duet: The following items need your attention!";
            } else {
              subject = "Duet: The following items need your attention!";
            }

            _msg3 = {
              to: storeNotificationInfo.recipientList,
              from: "duet@giveduet.org",
              templateId: "d-435a092f0be54b07b5135799ac7dfb01",
              dynamic_template_data: {
                storeName: storeNotificationInfo.name,
                items: storeNotificationInfo.updatedItems,
                subject: subject } };_context4.next = 5;return (


              sgMail.sendMultiple(_msg3));case 5:
            console.log("Message delivered to ".concat(storeNotificationInfo.name, " at ").concat(storeNotificationInfo.email, " successfully."));_context4.next = 11;break;case 8:_context4.prev = 8;_context4.t0 = _context4["catch"](0);

            _errorHandler["default"].handleError(_context4.t0, "sendgridHelpers/sendStoreNotificationEmail");case 11:case "end":return _context4.stop();}}}, _callee4, null, [[0, 8]]);}));return _sendStoreNotificationEmail.apply(this, arguments);}function



sendItemStatusUpdateEmail(_x6) {return _sendItemStatusUpdateEmail.apply(this, arguments);}function _sendItemStatusUpdateEmail() {_sendItemStatusUpdateEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(itemResult) {var emailTemplateId, _msg4;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.prev = 0;

            // Send item status update email
            emailTemplateId = 'd-15967181f418425fa3510cb674b7f580';
            _msg4 = {
              to: "duet.giving@gmail.com",
              from: "duet.giving@gmail.com",
              templateId: emailTemplateId,
              dynamic_template_data: {
                subject: process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" ? "[PROD] - Item Status Update" : "[SANDBOX] - Item Status Update",
                status: itemResult.status,
                itemId: itemResult.item_id,
                itemName: itemResult.name,
                itemSize: itemResult.size,
                itemLink: itemResult.link,
                pickupCode: itemResult.pickup_code,
                refugeeName: "".concat(itemResult.beneficiary_first, " ").concat(itemResult.beneficiary_last),
                refugeeId: itemResult.beneficiary_id,
                storeName: itemResult.store_name,
                donorName: "".concat(itemResult.donor_first, " ").concat(itemResult.donor_last),
                donorEmail: itemResult.donor_email } };_context5.next = 5;return (


              sgMail.send(_msg4));case 5:
            console.log("Item status update message delivered to Duet successfully.");_context5.next = 11;break;case 8:_context5.prev = 8;_context5.t0 = _context5["catch"](0);

            _errorHandler["default"].handleError(_context5.t0, "sendgridHelpers/sendItemStatusUpdateEmail");case 11:case "end":return _context5.stop();}}}, _callee5, null, [[0, 8]]);}));return _sendItemStatusUpdateEmail.apply(this, arguments);}function



sendItemPickedUpEmail(_x7) {return _sendItemPickedUpEmail.apply(this, arguments);}function _sendItemPickedUpEmail() {_sendItemPickedUpEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(itemResult) {var emailTemplateId, recipientList, subject, _msg5;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:_context6.prev = 0;

            // Send item status update email: PICKED_UP
            emailTemplateId = 'd-2e5e32e85d614b338e7e27d3eacccac3';


            if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "sandbox") {
              recipientList = ["duet.giving@gmail.com"];
              subject = "[SANDBOX] You've made a difference";
            } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" && itemResult.donor_email && itemResult.donor_first) {
              recipientList = [itemResult.donor_email, "duet.giving@gmail.com"];
              subject = "You've made a difference";
            } else {
              _errorHandler["default"].handleError("Unable to send itemPickedUpEmail! itemResult: " + JSON.stringify(itemResult), "sendgridHelpers/sendItemPickedUpEmail");
            }
            _msg5 = {
              to: recipientList,
              from: "duet@giveduet.org",
              templateId: emailTemplateId,
              dynamic_template_data: {
                subject: subject,
                item_name: itemResult.name,
                item_link: itemResult.link,
                donor_first: itemResult.donor_first,
                beneficiary_last: itemResult.beneficiary_last } };_context6.next = 6;return (


              sgMail.sendMultiple(_msg5));case 6:
            console.log("Item pickup message delivered successfully.");_context6.next = 12;break;case 9:_context6.prev = 9;_context6.t0 = _context6["catch"](0);

            _errorHandler["default"].handleError(_context6.t0, "sendgridHelpers/sendItemPickedUpEmail");case 12:case "end":return _context6.stop();}}}, _callee6, null, [[0, 9]]);}));return _sendItemPickedUpEmail.apply(this, arguments);}var _default =



{
  sendErrorEmail: sendErrorEmail,
  sendTypeformErrorEmail: sendTypeformErrorEmail,
  sendDonorThankYouEmail: sendDonorThankYouEmail,
  sendStoreNotificationEmail: sendStoreNotificationEmail,
  sendItemStatusUpdateEmail: sendItemStatusUpdateEmail,
  sendItemPickedUpEmail: sendItemPickedUpEmail };exports["default"] = _default;