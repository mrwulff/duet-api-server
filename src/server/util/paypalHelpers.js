// imports
import config from "../util/config.js";
import itemHelpers from '../util/itemHelpers.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from './errorHandler.js';
const paypal = config.paypalInit(); // PayPal
const paypalNVP = config.paypalNVPInit(); // PayPal NVP (legacy API)
import rp from 'request-promise';

const paypalSubscriptionProductId = "PROD-95548863PA9050738";

// ---------- PAYOUTS ---------- //

async function getPayPalPayoutInfoForItemIds(itemIds) {
  // Get stores' Payout info for list of items
  // Returns a list containing payout info for each store that we have to send a payout to
  // TODO: create a 'payout' object type?
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT stores.paypal AS paypal, " +
      "stores.name AS store_name, " +
      "stores.email AS store_email, " +
      "payouts.payment_amount AS payment_amount, " +
      "payouts.item_ids AS item_ids " +
      "FROM stores AS stores " +
      "INNER JOIN (" +
      "SELECT store_id, " +
      "SUM(price_euros) AS payment_amount, " +
      "GROUP_CONCAT(item_id) AS item_ids " +
      "FROM items_view " +
      "WHERE item_id IN (?) " +
      "GROUP BY store_id" +
      ") AS payouts " +
      "USING(store_id) " +
      "WHERE stores.payment_method = 'paypal'",
      [itemIds]);
    return rows.map(singleStoreResult => ({
      ...singleStoreResult,
      item_ids: itemHelpers.itemIdsGroupConcatStringToNumberList(singleStoreResult.item_ids),
      payment_amount: Number(singleStoreResult.payment_amount)
    }));
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/getPayPalPayoutInfo");
    throw err;
  }
}

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
async function sendPayout(payeeEmail, amount, currencyCode, itemIds) {
  try {
    const note = "Payment for Item IDs: " + itemHelpers.itemIdsListToString(itemIds); // e.g. "Item IDs: #79, #75, #10"
    console.log("Attempting payout of " + String(amount) + " " + String(currencyCode) + " to " + payeeEmail);
    const payoutInfo = {
      sender_batch_header: {
        email_subject: "You have a payment from Duet!"
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount,
            currency: currencyCode
          },
          receiver: payeeEmail,
          note: note
        }
      ]
    };

    const sync_mode = "false";
    return new Promise(function (resolve, reject) {
      paypal.payout.create(payoutInfo, sync_mode, function (error, payoutResp) {
        if (error) {
          console.log(error.response);
          reject(error);
        } else {
          console.log(payoutResp);
          resolve(payoutResp);
        }
      });
    });
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/sendPayout");
    throw err;
  }
}

async function sendNecessaryPayoutsForItemIds(itemIds) {
  // send necessary payouts for newly donated itemIds
  try {
    const payoutInfo = await getPayPalPayoutInfoForItemIds(itemIds);
    if (!payoutInfo.length) {
      console.log(`paypalHelpers/sendNecessaryPayoutsForItemIds: no paypal payouts necessary for itemIds: ${itemIds}`);
      return;
    }
    await Promise.all(payoutInfo.map(async singleStoreResult => {
      await sendPayout(
        singleStoreResult.paypal,
        singleStoreResult.payment_amount.toFixed(2),
        "EUR",
        singleStoreResult.item_ids
      );
      console.log("Successfully sent payout(s) for item IDs: " + singleStoreResult.item_ids);
      await itemHelpers.setStorePaymentInitiatedTimestampForItemIds(singleStoreResult.item_ids);
      // send "incoming payment" email to store
      sendgridHelpers.sendStorePaymentEmail({
        storeEmail: singleStoreResult.store_email,
        storeName: singleStoreResult.store_name,
        paymentAmountEuros: singleStoreResult.payment_amount.toFixed(2),
        paymentMethod: "PayPal",
        itemIds: itemHelpers.itemIdsListToString(singleStoreResult.item_ids),
      });
    }));
    // Check remaining balances
    checkPayPalUsdBalanceAndSendEmailIfLow();
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/sendPayoutForItemIds");
    throw err;
  }
}

// ---------- BALANCES ---------- //

async function getPayPalBalance(currencyCode) {
  try {
    const result = await paypalNVP.request('GetBalance', {
      RETURNALLCURRENCIES: 1
    });
    // console.log(result);
    let paypalBalance;
    // use paypal's stupid legacy conventions to get the EUR balance
    // see: https://developer.paypal.com/docs/classic/api/merchant/GetBalance-API-Operation-NVP/
    // e.g. L_CURRENCYCODE0 = USD, L_AMT0 = 100.00, L_CURRENCYCODE1 = EUR, L_AMT1 = 99.00
    for (const key of Object.keys(result)) {
      if (key.startsWith("L_CURRENCYCODE") && result[key] === currencyCode) {
        const currencyNum = parseInt(key.substring("L_CURRENCYCODE".length), 10);
        paypalBalance = result[`L_AMT${currencyNum}`];
      }
    }
    return paypalBalance;
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/getPayPalBalance");
    throw err;
  }
}

async function getPayPalEuroBalance() {
  try {
    const paypalEuroBalance = await getPayPalBalance("EUR");
    return paypalEuroBalance;
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/getPayPalEuroBalance");
    throw err;
  }
}

async function getPayPalUsdBalance() {
  try {
    const paypalUsdBalance = await getPayPalBalance("USD");
    return paypalUsdBalance;
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/paypalUsdBalance");
    throw err;
  }
}

async function checkPayPalEuroBalanceAndSendEmailIfLow() {
  try {
    const paypalEuroBalance = await getPayPalEuroBalance();
    console.log("Current PayPal EUR balance: ", paypalEuroBalance);
    if (paypalEuroBalance < process.env.PAYPAL_LOW_BALANCE_THRESHOLD) {
      console.log("WARNING: Low PayPal Euro balance! Sending warning email to duet.giving@gmail.com");
      sendgridHelpers.sendBalanceUpdateEmail("PayPal", "EUR", paypalEuroBalance, "WARNING");
      errorHandler.raiseWarning(`WARNING - checkPayPalEuroBalanceAndSendEmailIfLow: Low PayPal Euro balance of ${paypalEuroBalance}€!`);
    }
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/checkPayPalEuroBalanceAndSendEmailIfLow");
    throw err;
  }
}

async function checkPayPalUsdBalanceAndSendEmailIfLow() {
  try {
    const paypalUsdBalance = await getPayPalUsdBalance();
    console.log("Current PayPal USD balance: ", paypalUsdBalance);
    if (paypalUsdBalance < Number(process.env.PAYPAL_LOW_BALANCE_THRESHOLD)) {
      console.log("WARNING: Low PayPal USD balance! Sending warning email to duet.giving@gmail.com");
      sendgridHelpers.sendBalanceUpdateEmail("PayPal", "USD", paypalUsdBalance, "WARNING");
      errorHandler.raiseWarning(`WARNING - checkPayPalUsdBalanceAndSendEmailIfLow: Low PayPal USD balance of $${paypalUsdBalance}!`);
    }
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/checkPayPalUsdBalanceAndSendEmailIfLow");
    throw err;
  }
}

// ---------- SUBSCRIPTIONS ---------- //

async function findPayPalPlanIdForAmountUsd(amountUsd) {
  // find paypal subscription plan_id for a given amount_usd
  // if not found, return null
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT paypal_plan_id from paypal_subscription_plans " +
      "WHERE amount_usd=?",
      [amountUsd]
    );
    if (results.length) {
      return results[0].paypal_plan_id;
    }
    return null;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/findPayPalPlanIdForAmountUsd");
    throw err;
  }
}

async function createNewPayPalPlanIdForAmountUsd(amountUsd) {
  try {
    const conn = await config.dbInitConnectPromise();
    // use PayPal API to create new plan_id
    const paypalCreatePlanBody = {
      "product_id": paypalSubscriptionProductId,
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
      "(paypal_plan_id,amount_usd) " +
      "VALUES (?,?)",
      [planId, amountUsd]
    );
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/createNewPayPalPlanIdForAmountUsd");
    throw err;
  }
}

async function getPayPalPlanIdForAmountUsd(amountUsd) {
  try {
    let planId = await findPayPalPlanIdForAmountUsd(amountUsd);
    if (planId) {
      return planId;
    }
    planId = await createNewPayPalPlanIdForAmountUsd(amountUsd);
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/getPayPalPlanIdForAmountUsd");
  }
}

export default {
  // payouts
  getPayPalPayoutInfoForItemIds,
  sendPayout,
  sendNecessaryPayoutsForItemIds,

  // balances
  checkPayPalEuroBalanceAndSendEmailIfLow,
  checkPayPalUsdBalanceAndSendEmailIfLow,

  // subscriptions
  getPayPalPlanIdForAmountUsd,
};
