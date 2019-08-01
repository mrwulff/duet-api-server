"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));
var _sendgridHelpers = _interopRequireDefault(require("../util/sendgridHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function

sendNotificationEmailsToStores() {return _sendNotificationEmailsToStores.apply(this, arguments);}function _sendNotificationEmailsToStores() {_sendNotificationEmailsToStores = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {var results;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return (


              _sqlHelpers["default"].getStoresThatNeedNotification());case 3:results = _context2.sent;if (!(

            results.length < 1)) {_context2.next = 7;break;}
            // no stores need notification
            console.log('No stores need notification currently');return _context2.abrupt("return");case 7:_context2.next = 9;return (




              Promise.all(results.map( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(result) {var updatedItems, recipientList;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (

                            _sqlHelpers["default"].getItemsForNotificationEmail(result.store_id));case 2:updatedItems = _context.sent;if (!(
                          updatedItems.length === 0)) {_context.next = 6;break;}
                          console.log('No new updates to items');return _context.abrupt("return");case 6:



                          // Get recipient list
                          recipientList = [];
                          if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
                            recipientList = ['duet.giving@gmail.com'];
                          } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
                            recipientList = ['duet.giving@gmail.com', result.email];
                          }

                          // Send email
                          _context.next = 10;return _sendgridHelpers["default"].sendStoreNotificationEmail({
                            recipientList: recipientList,
                            name: result.name,
                            email: result.email,
                            updatedItems: updatedItems });case 10:_context.next = 12;return (



                            _sqlHelpers["default"].unsetItemsNotificationFlag(updatedItems.map(function (item) {return item.itemId;})));case 12:_context.next = 14;return (
                            _sqlHelpers["default"].unsetSingleStoreNotificationFlag(result.store_id));case 14:case "end":return _context.stop();}}}, _callee);}));return function (_x) {return _ref.apply(this, arguments);};}())));case 9:_context2.next = 15;break;case 11:_context2.prev = 11;_context2.t0 = _context2["catch"](0);


            _errorHandler["default"].handleError(_context2.t0, "storeHelpers/sendStoreownerNotificationEmail");throw _context2.t0;case 15:case "end":return _context2.stop();}}}, _callee2, null, [[0, 11]]);}));return _sendNotificationEmailsToStores.apply(this, arguments);}var _default =




{
  sendNotificationEmailsToStores: sendNotificationEmailsToStores };exports["default"] = _default;