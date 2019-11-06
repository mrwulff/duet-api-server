require("dotenv").config();
import paypalHelpers from "../util/paypalHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import itemHelpers from "../util/itemHelpers.js";
import donationHelpers from "../util/donationHelpers.js";

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

async function processSuccessfulTransaction(req, res) {
  const donationInfo = req.body;
  console.log(`processSuccessfulDonation donation info: ${JSON.stringify(donationInfo)}`);
  if (donationInfo.itemIds) {
    try {
      // Create Donation entry
      if (process.env.PAYPAL_MODE === "live" && !donationInfo.email) {
        console.log("Error: Call to processSuccessfulDonation() without donor email in live mode!");
        return res.status(500).send("Error: Could not retrieve donor email!");
      }
      if (process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email) {
        console.log("Warning: Call to processSuccessfulDonation() without donor email in sandbox mode.");
      }
      const donationId = await donationHelpers.insertDonationIntoDB(donationInfo);

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

export default {
  getDonation,
  verifyNewTransaction,
  cancelTransaction,
  processSuccessfulTransaction
};
