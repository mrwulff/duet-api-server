require("dotenv").config();

// SQL, Promise version
let connPromise;
async function dbInitConnectPromise() {
  if (!connPromise) {
    const mysqlPromise = require('mysql2/promise');
    connPromise = await mysqlPromise.createPool({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE
    });
  }
  return connPromise;
}

// Sendgrid
let sendgridMail;
function sendgridInit() {
  if (!sendgridMail) {
    sendgridMail = require("@sendgrid/mail");
    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sendgridMail;
}

// AWS S3
let s3;
function s3Init() {
  if (!s3) {
    const AWS = require("aws-sdk");
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }
  return s3;
}

// FB Messenger
let messenger;
function fbMessengerInit() {
  if (!messenger) {
    const FBMessenger = require('fb-messenger');
    messenger = new FBMessenger({ token: process.env.FB_ACCESS_TOKEN });
  }
  return messenger;
}

// PayPal
let paypal;
function paypalInit() {
  if (!paypal) {
    // eslint-disable-next-line no-unused-expressions
    ("use strict");
    const paypalConfig = {
      mode: process.env.PAYPAL_MODE,
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET
    };
    paypal = require("paypal-rest-sdk");
    paypal.configure(paypalConfig);
  }
  return paypal;
}

// PayPal NVP: https://www.npmjs.com/package/paypal-nvp-api
let paypalNVP;
function paypalNVPInit() {
  if (!paypalNVP) {
    const paypalNVPPackage = require('paypal-nvp-api');
    const config = {
      mode: process.env.PAYPAL_MODE,
      username: process.env.PAYPAL_NVP_API_USERNAME,
      password: process.env.PAYPAL_NVP_API_PASSWORD,
      signature: process.env.PAYPAL_NVP_API_SIGNATURE
    };
    paypalNVP = paypalNVPPackage(config);
  }
  return paypalNVP;
}


export default { 
  dbInitConnectPromise,
  sendgridInit, 
  s3Init, 
  fbMessengerInit, 
  paypalInit,
  paypalNVPInit
};
