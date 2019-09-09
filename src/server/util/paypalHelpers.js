import config from "../util/config.js";
import itemHelpers from '../util/itemHelpers.js';
const paypal = config.paypalInit(); // PayPal
const paypalNVP = config.paypalNVPInit(); // PayPal NVP (legacy API)
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from './errorHandler.js';

// Send payout to store, return true if successful
// sendPayout("lucashu1998@gmail.com", 1.00, "USD", [61, 62, 63])
async function sendPayout(payeeEmail, amount, currencyCode, itemIds) {
  try {
    var note = "Payment for Item IDs: " + itemHelpers.itemIdsListToString(itemIds); // e.g. "Item IDs: #79, #75, #10"
    console.log("Attempting payout of " + String(amount) + " " + String(currencyCode) + " to " + payeeEmail);
    var payoutInfo = {
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

    var sync_mode = "false";
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

async function getPayPalEuroBalance() {
  try {
    var result = await paypalNVP.request('GetBalance', {
      RETURNALLCURRENCIES: 1
    });
    // console.log(result);
    var paypalEuroBalance;
    // use paypal's stupid legacy conventions to get the EUR balance
      // see: https://developer.paypal.com/docs/classic/api/merchant/GetBalance-API-Operation-NVP/
      // e.g. L_CURRENCYCODE0 = USD, L_AMT0 = 100.00, L_CURRENCYCODE1 = EUR, L_AMT1 = 99.00
    for (const key of Object.keys(result)) {
      if (key.startsWith("L_CURRENCYCODE") && result[key] == "EUR") {
        var currencyNum = parseInt(key.substring("L_CURRENCYCODE".length));
        paypalEuroBalance = result[`L_AMT${currencyNum}`];
      }
    }
    console.log("PayPal Euro balance: " + paypalEuroBalance);
    return paypalEuroBalance;
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/getPayPalEuroBalance");
    throw err;
  }
}

async function checkPayPalEuroBalanceAndSendEmailIfLow() {
  try {
    var paypalEuroBalance = await getPayPalEuroBalance();
    if (paypalEuroBalance <= process.env.PAYPAL_LOW_BALANCE_THRESHOLD) {
      console.log("WARNING: Low PayPal Euro balance! Sending warning email to duet.giving@gmail.com");
      await sendgridHelpers.sendBalanceUpdateEmail("PayPal", "EUR", paypalEuroBalance, "WARNING");
    }
  } catch (err) {
    errorHandler.handleError(err, "paypalHelpers/checkPayPalEuroBalanceAndSendEmailIfLow");
    throw err;
  }
}

export default {
  sendPayout,
  checkPayPalEuroBalanceAndSendEmailIfLow
};
