"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("../util/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
var sgMail = _config["default"].sendgridInit(); // Sendgrid
function
sendDonorThankYouEmail(_x) {return _sendDonorThankYouEmail.apply(this, arguments);}function _sendDonorThankYouEmail() {_sendDonorThankYouEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(donorInfo) {var email, firstName, msg;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            // Send donor thank-you email
            // Takes in donorInfo object with "email", "firstName" fields
            email = donorInfo['email'];
            firstName = donorInfo['firstName'];
            msg = {
              to: email,
              from: "duet@giveduet.org",
              templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
              dynamic_template_data: {
                name: firstName } };



            sgMail.
            send(msg).
            then(function () {
              console.log("Donation confirmation sent ".concat(email, " to successfully."));
            })["catch"](
            function (error) {
              console.error(error.toString());
            });case 4:case "end":return _context.stop();}}}, _callee);}));return _sendDonorThankYouEmail.apply(this, arguments);}var _default =


{
  sendDonorThankYouEmail: sendDonorThankYouEmail };exports["default"] = _default;