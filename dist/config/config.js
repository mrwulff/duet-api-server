"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _mysql = _interopRequireDefault(require("mysql2"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}
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

// Sendgrid
var sendgridMail;
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


{ dbInitConnect: dbInitConnect, sendgridInit: sendgridInit, s3Init: s3Init, fbMessengerInit: fbMessengerInit, paypalInit: paypalInit };exports["default"] = _default;