"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _storeHelpers = _interopRequireDefault(require("../util/storeHelpers.js"));
var _itemHelpers = _interopRequireDefault(require("../util/itemHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));
require("babel-polyfill");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
var CronJob = require('cron').CronJob;

// CRON job to send notification email to storeowner every day at 8:00 AM if there are
// novel items to that (1) need price approval or (2) need to be picked up.
// Also moves REQUESTED items to LISTED (and sets notification flags)
// TODO: async/await stuff
new CronJob(process.env.CRON_INTERVAL_STORE_NOTIFICATIONS, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
          console.log('running cron job to move REQUESTED items to LISTED...');_context.next = 3;return (
            _itemHelpers["default"].listRequestedItemsAndSetNotificiationFlags());case 3:
          console.log('running cron job checking if stores need to be notified...');_context.next = 6;return (
            _storeHelpers["default"].sendNotificationEmailsToStores());case 6:case "end":return _context.stop();}}}, _callee);})),
null, true, 'America/Los_Angeles');function

login(_x, _x2) {return _login.apply(this, arguments);}function _login() {_login = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {var email, storeResult;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;

            email = req.body.email;if (!
            email) {_context2.next = 9;break;}_context2.next = 5;return (
              _sqlHelpers["default"].getStoreInfoFromEmail(email));case 5:storeResult = _context2.sent;
            if (!storeResult) {
              res.status(400).send({ err: "Store email does not exist" });
            } else
            {
              res.status(200).send({
                storeId: storeResult["store_id"],
                name: storeResult["name"],
                email: storeResult["email"] });

            }_context2.next = 10;break;case 9:

            res.status(400).send({ err: "Missing email in request body " });case 10:_context2.next = 16;break;case 12:_context2.prev = 12;_context2.t0 = _context2["catch"](0);


            _errorHandler["default"].handleError(_context2.t0, "stores/login");
            res.status(500).send();case 16:case "end":return _context2.stop();}}}, _callee2, null, [[0, 12]]);}));return _login.apply(this, arguments);}var _default =



{
  login: login };exports["default"] = _default;