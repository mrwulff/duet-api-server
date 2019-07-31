"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}var rp = require('request-promise');

// Cached currency rates
var currencyRates;

// Get currency rates in openexchangerates format
function updateCurrencyRates() {return _updateCurrencyRates.apply(this, arguments);}













// Return latest currency rates
function _updateCurrencyRates() {_updateCurrencyRates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {var options;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;options = { uri: "https://openexchangerates.org/api/latest.json?app_id=7f0785f2b1bc4741b374c04b20d229a6", json: true };_context.next = 4;return rp(options);case 4:currencyRates = _context.sent;console.log("Updated currency rate! EUR in USD: " + currencyRates.rates.EUR);_context.next = 12;break;case 8:_context.prev = 8;_context.t0 = _context["catch"](0);_errorHandler["default"].handleError(_context.t0, "currencyHelpers/updateCurrencyRates");throw _context.t0;case 12:case "end":return _context.stop();}}}, _callee, null, [[0, 8]]);}));return _updateCurrencyRates.apply(this, arguments);}function getCurrencyRates() {return _getCurrencyRates.apply(this, arguments);}function _getCurrencyRates() {_getCurrencyRates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;if (

            currencyRates) {_context2.next = 4;break;}_context2.next = 4;return (
              updateCurrencyRates());case 4:return _context2.abrupt("return",

            currencyRates);case 7:_context2.prev = 7;_context2.t0 = _context2["catch"](0);

            _errorHandler["default"].handleError(_context2.t0, "currencyHelpers/getCurrencyRates");throw _context2.t0;case 11:case "end":return _context2.stop();}}}, _callee2, null, [[0, 7]]);}));return _getCurrencyRates.apply(this, arguments);}var _default =




{
  updateCurrencyRates: updateCurrencyRates,
  getCurrencyRates: getCurrencyRates };exports["default"] = _default;