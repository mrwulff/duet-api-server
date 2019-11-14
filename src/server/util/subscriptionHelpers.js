// imports
require("dotenv").config();
import config from "../util/config.js";
import errorHandler from "../util/errorHandler.js";
const rp = require('request-promise');

const duetSubscriptionProductId = "PROD-95548863PA9050738";

async function insertSubscriptionIntoDB(email, firstName, lastName, amount, bankTransferFee, serviceFee, country, paypalSubscriptionId) {
  // Insert subscription info into DB, return insert ID
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "INSERT INTO donations (timestamp,donor_email,donor_fname,donor_lname,donation_amt_usd," +
      "bank_transfer_fee_usd,service_fee_usd,donor_country,paypal_subscription_id,is_subscription) " +
      "VALUES (NOW(),?,?,?,?,?,?,?,?,1)",
      [
        email,
        firstName,
        lastName,
        amount,
        bankTransferFee,
        serviceFee,
        country,
        paypalSubscriptionId
      ]
    );
    const subscriptionId = results.insertId;
    console.log(`Successfully entered subscription into DB. subscriptionId: ${subscriptionId}`);
    return subscriptionId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/insertSubscriptionIntoDB");
    throw err;
  }
}

async function findPlanIdForAmountUsd(amountUsd) {
  // find paypal subscription plan_id for a given amount_usd
  // if not found, return null
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT plan_id from paypal_subscription_plans " + 
      "WHERE amount_usd=?",
      [amountUsd]
      );
    if (results.length) {
      return results[0].plan_id;
    }
    return null;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/findPlanIdForAmountUsd");
    throw err;
  }
}

async function createNewPlanIdForAmountUsd(amountUsd) {
  try {
    const conn = await config.dbInitConnectPromise();
    // use PayPal API to create new plan_id
    const paypalCreatePlanBody = {
      "product_id": duetSubscriptionProductId,
      "name": "Duet Monthly Subscription",
      "description": "Duet Monthly Subscription",
      "billing_cycles": [
        {
          "frequency": {
            "interval_unit": "MONTH",
            "interval_count": 1
          },
          "tenure_type": "REGULAR",
          "sequence": 1,
          "total_cycles": 0,
          "pricing_scheme": {
            "fixed_price": {
              "value": amountUsd.toFixed(2),
              "currency_code": "USD"
            }
          }
        }
      ],
      "payment_preferences": {
        "auto_bill_outstanding": true,
        "payment_failure_threshold": 3
      }
    };
    const res = await rp(
      `${process.env.PAYPAL_API_URL}/v1/billing/plans`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        auth: {
          user: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_CLIENT_SECRET
        },
        body: paypalCreatePlanBody,
        json: true
      }
    );
    // insert plan_id into our DB (paypal_subscription_plans table)
    const planId = res.id;
    await conn.query(
      "INSERT INTO paypal_subscription_plans " +
      "(plan_id,amount_usd) " +
      "VALUES (?,?)",
      [planId, amountUsd]
      );
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/createNewPlanIdForAmountUsd");
    throw err;
  }
}

async function getPlanIdForAmountUsd(amountUsd) {
  try {
    let planId = await findPlanIdForAmountUsd(amountUsd);
    if (planId) {
      return planId;
    }
    planId = await createNewPlanIdForAmountUsd(amountUsd);
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/getPlanIdForAmountUsd");
    throw err;
  }
}

export default {
  // insert subscription
  insertSubscriptionIntoDB,

  // get/create subscription
  getPlanIdForAmountUsd
}