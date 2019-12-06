import config from "../util/config.js";
import itemHelpers from '../util/itemHelpers.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from './errorHandler.js';
const paypal = config.paypalInit(); // PayPal
const paypalNVP = config.paypalNVPInit(); // PayPal NVP (legacy API)

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
      await sendgridHelpers.sendBalanceUpdateEmail("PayPal", "EUR", paypalEuroBalance, "WARNING");
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
    if (paypalUsdBalance < process.env.PAYPAL_LOW_BALANCE_THRESHOLD) {
      console.log("WARNING: Low PayPal USD balance! Sending warning email to duet.giving@gmail.com");
      await sendgridHelpers.sendBalanceUpdateEmail("PayPal", "USD", paypalUsdBalance, "WARNING");
    }
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/checkPayPalUsdBalanceAndSendEmailIfLow");
    throw err;
  }
}

export default {
  getPayPalPayoutInfoForItemIds,
  sendPayout,
  checkPayPalEuroBalanceAndSendEmailIfLow,
  checkPayPalUsdBalanceAndSendEmailIfLow
};
