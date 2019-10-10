require("dotenv").config();
import sqlHelpers from "../util/sqlHelpers.js";
import paypalHelpers from "../util/paypalHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import itemHelpers from "../util/itemHelpers.js";
import donationHelpers from "../util/donationHelpers.js";

async function getDonation(req, res) {
  try {
    let donationObj = await donationHelpers.getDonationObjFromDonationId(req.query.donation_id);
    return res.json(donationObj);
  } catch (err) {
    errorHandler.handleError(err, "donate/getDonation");
    return res.status(500).send();
  }
}

async function itemPaid(req, res) {
  let donationInfo = req.body;
  console.log(`itemPaid donation info: ${JSON.stringify(donationInfo)}`);
  if (donationInfo.itemIds) {
    try {
      // Create Donation entry
      let donationId;
      if (process.env.PAYPAL_MODE === "live" && !donationInfo.email) {
        console.log("Error: Call to itemPaid() without donor email in live mode!");
        return res.status(500).send("Error: Could not retrieve donor email!");
      }
      if (process.env.PAYPAL_MODE === "sandbox" && !donationInfo.email) {
        console.log("Warning: Call to itemPaid() without donor email in sandbox mode.");
        donationId = await sqlHelpers.insertDonationIntoDB(donationInfo);
      } else {
        donationId = await sqlHelpers.insertDonationIntoDB(donationInfo);
      }

      donationInfo.itemIds.forEach(async function (itemId) {
        // Mark items as donated
        await sqlHelpers.markItemAsDonated(itemId, donationId);
        // Send generic item status updated email
        let itemResult = await sqlHelpers.getItem(itemId);
        if (itemResult) {
          sendgridHelpers.sendItemStatusUpdateEmail(itemResult);
        }
      });
      console.log("Successfully marked items as donated: " + donationInfo.itemIds);

      // Send PayPal payout to stores with payment_method='paypal'
      let payoutInfo = await sqlHelpers.getPayPalPayoutInfo(donationInfo.itemIds);
      await Promise.all(payoutInfo.map(async singleStoreResult => {
        await paypalHelpers.sendPayout(
          singleStoreResult.paypal,
          singleStoreResult.payment_amount,
          "EUR",
          singleStoreResult.item_ids
        );
        console.log("Successfully sent payout(s) for item IDs: " + donationInfo.itemIds);
        // send "incoming payment" email to store
        sendgridHelpers.sendStorePaymentEmail({
          storeEmail: singleStoreResult.store_email,
          storeName: singleStoreResult.store_name,
          paymentAmountEuros: singleStoreResult.payment_amount,
          paymentMethod: "PayPal",
          itemIds: itemHelpers.itemIdsListToString(singleStoreResult.item_ids),
        });
      }));
      // Check remaining balances
      await paypalHelpers.checkPayPalEuroBalanceAndSendEmailIfLow();

      // SEND EMAIL TO DONOR
      if (donationInfo.email) {
        let donorInfo = {
          email: donationInfo.email,
          firstName: donationInfo.firstName
        }
        sendgridHelpers.sendDonorThankYouEmail(donorInfo);
      }

    } catch (err) {
      errorHandler.handleError(err, "donate/itemPaid");
      return res.status(500).send();
    }
    return res.status(200).send();
  } 
  console.log('Item ids not found in request body for item donation');
  return res.status(200).json();
  
}

export default {
  getDonation,
  itemPaid
};
