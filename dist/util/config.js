"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _mysql = _interopRequireDefault(require("mysql2"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
require("dotenv").config();

// SQL
var conn;
function dbInitConnect() {
  if (!conn) {
    conn = _mysql["default"].createConnection({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE });

  }
  return conn;
}

// SQL, Promise version (TODO: transition to this)
var connPromise;function
dbInitConnectPromise() {return _dbInitConnectPromise.apply(this, arguments);}













// Sendgrid
function _dbInitConnectPromise() {_dbInitConnectPromise = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {var mysqlPromise;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (connPromise) {_context.next = 5;break;}mysqlPromise = require('mysql2/promise');_context.next = 4;return mysqlPromise.createConnection({ host: process.env.DATABASE_HOST, port: process.env.DATABASE_PORT, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASS, database: process.env.DATABASE });case 4:connPromise = _context.sent;case 5:return _context.abrupt("return", connPromise);case 6:case "end":return _context.stop();}}}, _callee);}));return _dbInitConnectPromise.apply(this, arguments);}var sendgridMail;
function sendgridInit() {
  if (!sendgridMail) {
    sendgridMail = require("@sendgrid/mail");
    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sendgridMail;
}

// AWS S3
var s3;
function s3Init() {
  if (!s3) {
    var AWS = require("aws-sdk");
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });

  }
  return s3;
}

// FB Messenger
var messenger;
function fbMessengerInit() {
  if (!messenger) {
    var FBMessenger = require('fb-messenger');
    messenger = new FBMessenger({ token: process.env.FB_ACCESS_TOKEN });
  }
  return messenger;
}

// PayPal
var paypal;
function paypalInit() {
  if (!paypal) {
    "use strict";
    var paypalConfig = {
      mode: process.env.PAYPAL_MODE,
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET };

    paypal = require("paypal-rest-sdk");
    paypal.configure(paypalConfig);
  }
  return paypal;
}var _default =


{
  dbInitConnect: dbInitConnect, dbInitConnectPromise: dbInitConnectPromise,
  sendgridInit: sendgridInit,
  s3Init: s3Init,
  fbMessengerInit: fbMessengerInit,
  paypalInit: paypalInit };exports["default"] = _default;