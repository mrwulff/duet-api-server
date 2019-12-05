require("dotenv").config();
import paypalHelpers from "../util/paypalHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import itemHelpers from "../util/itemHelpers.js";
import donationHelpers from "../util/donationHelpers.js";
import subscriptionHelpers from "../util/subscriptionHelpers.js";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function getDonation(req, res) {
  try {
    const donationObj = await donationHelpers.getDonationObjFromDonationId(req.query.donation_id);
    return res.json(donationObj);
  } catch (err) {
    errorHandler.handleError(err, "donate/getDonation");
    return res.sendStatus(500);
  }
}

async function verifyNewTransaction(req, res) {
  // make sure items are not currently being donated (or have not already been donated)
  try {
    console.log(`verifyNewTransaction with itemIds: ${req.body.itemIds}`);
    await itemHelpers.verifyItemsReadyForTransactionAndSetFlagsIfVerified(req.body.itemIds);
    console.log(`verifyNewTransaction succeeded for itemIds: ${req.body.itemIds}`);
    return res.sendStatus(200);
  } catch (err) {
    console.log(`verifyNewTransaction failed: items are currently in transaction, or have already been donated: ${req.body.itemIds}`);
    errorHandler.handleError(err, "donate/verifyTransaction"); // let us know a race condition has occurred
    return res.sendStatus(409);
  }
}

async function cancelTransaction(req, res) {
  // onError --> cancel transaction: unset in_current_transaction flags
  try {
    console.log(`called cancelTransaction with itemIds: ${req.body.itemIds}`);
    await itemHelpers.unsetInCurrentTransactionFlagForItemIds(req.body.itemIds);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "donate/cancelTransaction");
    return res.sendStatus(500);
  }
}

async function chargeTransaction(req, res) {
  const chargeObj = req.body;
  console.log(`Attempting to charge transaction object: ${JSON.stringify(chargeObj)}`);

  if (chargeObj.paymentMethod === 'stripe') {
    const amount = Math.ceil(parseFloat(chargeObj.amount) * 100) // stripe needs amount to be in cents

    try {
      const { payment_method_details, status, id } = await stripe.charges.create({
        amount,
        currency: 'usd',
        description: `Donation for item ids: ${chargeObj.itemIds}`,
        source: chargeObj.token,
      });

      return res.status(200).send({id, status, donorCountry: payment_method_details.card.country });
    } catch (err) {
      let message = '';
      switch( err.type ) {
        case 'StripeCardError':
          message = `Whoops! There was an error. ${err.message}`; // Declined card error, send back user friendly message
          break;
        default:
          message = 'Whoops! Stripe experienced an error. Please go back and try again in a few minutes. If the problem persists, please reach out to hello@giveduet.org to help us help you!'; 
      }
      console.log(`Error processing payment on stripe: ${err}`);
      return res.status(500).send({message});
    }
  }
  return res.sendStatus(500);
}

async function processSuccessfulTransaction(req, res) {
  const donationInfo = req.body;
  console.log(`processSuccessfulDonation donation info: ${JSON.stringify(donationInfo)}`);

  let donationId;
  if (donationInfo.itemIds) {
    try {
      // Using Paypal to process payment
      if (donationInfo.paymentMethod === 'paypal') {
        if (process.env.PAYPAL_MODE === "live" && !donationInfo.email) {
          console.log("Error: Call to processSuccessfulDonation() without donor email in live mode!");
          return res.status(500).send("Error: Could not retrieve donor email!");
        }
        if (process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email) {
          console.log("Warning: Call to processSuccessfulDonation() without donor email in sandbox mode.");
        }
      }
      
      const paypalOrderId = donationInfo.paypalOrderId ? donationInfo.paypalOrderId : null;
      const stripeOrderId = donationInfo.stripeId ? donationInfo.stripeId : null;
      const paymentMethod = donationInfo.paymentMethod ? donationInfo.paymentMethod : null;

      donationId = await donationHelpers.insertDonationIntoDB(
        donationInfo.email, donationInfo.firstName, donationInfo.lastName,
        donationInfo.amount, donationInfo.bankTransferFee, donationInfo.serviceFee,
        donationInfo.country, paypalOrderId, stripeOrderId, paymentMethod
      );

      // Mark items as donated; unset in_current_transaction
      await Promise.all(donationInfo.itemIds.map(async itemId => {
        await donationHelpers.markItemAsDonated(itemId, donationId);
        const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
        if (itemObj) {
          sendgridHelpers.sendItemStatusUpdateEmail(itemObj);
        }
      }));

      await itemHelpers.unsetInCurrentTransactionFlagForItemIds(donationInfo.itemIds);
      console.log("Successfully marked items as donated: " + donationInfo.itemIds);

      // Send email to donor
      if (donationInfo.email) {
        sendgridHelpers.sendDonorThankYouEmailV2(donationId);
      }

      // Send PayPal payout to stores with payment_method='paypal'
      const payoutInfo = await paypalHelpers.getPayPalPayoutInfoForItemIds(donationInfo.itemIds);
      await Promise.all(payoutInfo.map(async singleStoreResult => {
        await paypalHelpers.sendPayout(
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
      await paypalHelpers.checkPayPalEuroBalanceAndSendEmailIfLow();
    } catch (err) {
      errorHandler.handleError(err, "donate/processSuccessfulDonation");
      return res.sendStatus(500);
    }
    return res.sendStatus(200);
  } 
  console.log('Item ids not found in request body for item donation');
  return res.sendStatus(200);
}

async function createSubscription(req, res) {
  try {
    const planId = await subscriptionHelpers.getPlanIdForAmountUsd(req.body.amount_usd);
    return res.json({ 'plan_id': planId });
  } catch (err) {
    errorHandler.handleError(err, "donate/getSubscriptionPlanId");
    return res.sendStatus(500);
  }
}

async function processSuccessfulSubscription(req, res) {
  try {
    // TODO: WIP
    const subscriptionInfo = req.body;
    console.log(`donate/processSuccessfulSubscription subscriptionInfo: ${JSON.stringify(subscriptionInfo)}`);
    // Add subscription to DB
    const donationId = await subscriptionHelpers.insertSubscriptionIntoDB(
      subscriptionInfo.email,
      subscriptionInfo.firstName,
      subscriptionInfo.lastName,
      subscriptionInfo.amount,
      subscriptionInfo.bankTransferFee,
      subscriptionInfo.serviceFee,
      subscriptionInfo.country,
      subscriptionInfo.paypalSubscriptionId
    );
    console.log(`donate/processSuccessfulSubscription donationId: ${donationId}`);
    // Send thank-you email to donor
    sendgridHelpers.sendSubscriptionThankYouEmail(donationId);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "donate/processSuccessfulSubscription");
    return res.sendStatus(500);
  }
}

async function sendDonationConfirmationEmail(req, res) {
  try {
    const donationId = req.body.donationId;
    await sendgridHelpers.sendDonorThankYouEmailV2(donationId);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "donate/sendDonationConfirmationEmail");
    return res.sendStatus(500);
  }
}

export default {
  // data models
  getDonation,

  // one-time donations
  verifyNewTransaction,
  cancelTransaction,
  chargeTransaction,
  processSuccessfulTransaction,

  // subscriptions
  createSubscription,
  processSuccessfulSubscription,

  // emails
  sendDonationConfirmationEmail
};
