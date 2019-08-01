"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _currencyHelpers = _interopRequireDefault(require("../util/currencyHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
var CronJob = require('cron').CronJob;
require('dotenv').config();

// Update currency rates
function updateCurrencyRates(_x, _x2) {return _updateCurrencyRates.apply(this, arguments);}









// CRON job to update currency rates
function _updateCurrencyRates() {_updateCurrencyRates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;_context.next = 3;return _currencyHelpers["default"].updateCurrencyRates();case 3:return _context.abrupt("return", res.status(200).send());case 6:_context.prev = 6;_context.t0 = _context["catch"](0);_errorHandler["default"].handleError(_context.t0, "currency/updateCurrencyRates");return _context.abrupt("return", res.status(500).send());case 10:case "end":return _context.stop();}}}, _callee, null, [[0, 6]]);}));return _updateCurrencyRates.apply(this, arguments);}new CronJob(process.env.CRON_INTERVAL_CURRENCY, function () {
  console.log('running cron job to update currency rates...');
  _currencyHelpers["default"].updateCurrencyRates();
}, null, true, 'America/Los_Angeles');

// Get currency rates in openexchangerates format
function getCurrencyRates(_x3, _x4) {return _getCurrencyRates.apply(this, arguments);}function _getCurrencyRates() {_getCurrencyRates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {var currencyRates;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return (

              _currencyHelpers["default"].getCurrencyRates());case 3:currencyRates = _context2.sent;return _context2.abrupt("return",
            res.json(currencyRates));case 7:_context2.prev = 7;_context2.t0 = _context2["catch"](0);

            _errorHandler["default"].handleError(_context2.t0, "currency/getCurrencyRates");return _context2.abrupt("return",
            res.status(500).send());case 11:case "end":return _context2.stop();}}}, _callee2, null, [[0, 7]]);}));return _getCurrencyRates.apply(this, arguments);}var _default =



{
  updateCurrencyRates: updateCurrencyRates,
  getCurrencyRates: getCurrencyRates };exports["default"] = _default;