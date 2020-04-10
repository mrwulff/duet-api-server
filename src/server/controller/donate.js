/* eslint-disable no-case-declarations */
// imports
import paypalHelpers from "../util/paypalHelpers.js";
import stripeHelpers from "../util/stripeHelpers.js";
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import itemHelpers from "../util/itemHelpers.js";
import slackHelpers from "../util/slackHelpers.js";
import donationHelpers from "../util/donationHelpers.js";
import campaignHelpers from "../util/campaignHelpers.js";

async function getDonation(req, res) {
  try {
    const donationObj = await donationHelpers.getDonationObjFromDonationId(req.query.donation_id);
    return res.json(donationObj);
  } catch (err) {
    errorHandler.handleError(err, "donate/getDonation");
    return res.sendStatus(500);
  }
}

async function captureTransaction(req, res) {
  try {
    const { itemIds, campaignInfo, amount, bankTransferFee, serviceFee, itemPricesUsd, paymentMethod, honoreeInfo, referralCode } = req.body;
    if ((!itemIds && !campaignInfo) || 
      !amount || !paymentMethod || 
      bankTransferFee == null || bankTransferFee === undefined || 
      serviceFee === null || serviceFee === undefined) {
      console.log(`captureTransaction - incomplete request body: ${JSON.stringify(req.body)}`);
      return res.sendStatus(400);
    }

    // ---------- Stripe ---------- //
    if (paymentMethod === 'stripe') {
      // Validate input
      const { stripeToken, donorInfo } = req.body;
      if (!stripeToken) {
        console.log(`captureTransaction (stripe): missing stripeToken from request body`);
        return res.sendStatus(400);
      }
      if (!donorInfo || !donorInfo.email || !donorInfo.firstName || !donorInfo.lastName) {
        console.log(`captureTransaction (stripe): donorInfo has missing fields: ${JSON.stringify(donorInfo)}`);
        return res.sendStatus(400);
      }

      // ---------- Stripe: Regular Item Donation ---------- //
      if (itemIds) {
        // Verify items are ready for transaction
        try {
          await itemHelpers.verifyItemsReadyForTransactionAndSetFlagsIfVerified(itemIds);
        } catch (error) {
          const raceCondItems = error.raceCondItems ? error.raceCondItems : [];
          const raceCondItemIds = raceCondItems.map(item => item.itemId);
          console.log(`DuetRaceCondition with raceCondItemIds: ${raceCondItemIds}`);
          return res.status(500).send({ duetErrorCode: "DuetRaceConditionError", error, raceCondItems });
        }

        // Create donation entry
        const donationId = await donationHelpers.insertDonationIntoDB({
          donorInfo,
          amount, bankTransferFee, serviceFee, paymentMethod,
          honoreeInfo, referralCode
        });

        // Charge card
        let stripeOrderId, donorCountry;
        const chargeDescription = `Donation for item ids: ${itemIds}`;
        try {
          const { payment_method_details, status, id } = await stripeHelpers.createStripeChargeForAmountUsd(amount, chargeDescription, stripeToken);
          stripeOrderId = id;
          donorCountry = payment_method_details.card.country;
        } catch (error) {
          console.log(`chargeTransaction: stripe error: ${error}`);
          await itemHelpers.unsetInCurrentTransactionFlagForItemIds(itemIds);
          donationHelpers.removeDonationFromDB(donationId);
          return res.status(500).send({ duetErrorCode: 'StripeError', error });
        }

        // Update donor_country, stripeOrderId
        await donationHelpers.setDonorCountry(donationId, donorCountry);
        await donationHelpers.setStripeOrderId(donationId, stripeOrderId);

        // Update items' donationId
        await Promise.all(itemIds.map(async itemId => {
          await donationHelpers.markItemAsDonated(itemId, donationId);
          if (process.env.NODE_ENV === 'production') {
            slackHelpers.sendDonatedItemMessage(itemId);
          }
          const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
          if (itemObj) {
            sendgridHelpers.sendItemStatusUpdateEmail(itemObj);
          }
        }));

        // Store checkout prices (USD) in database
        if (itemPricesUsd) {
          await Promise.all(itemPricesUsd.map(async priceInfo => {
            await itemHelpers.updateCheckoutPriceUsd(priceInfo.itemId, priceInfo.priceUsd);
          }));
        }

        // Unset 'in_current_transaction' flags
        await itemHelpers.unsetInCurrentTransactionFlagForItemIds(itemIds);

        // Send email to donor (don't await)
        sendgridHelpers.sendDonorThankYouEmailV3(donationId);
        // Send PayPal payout to stores with payment_method='paypal' (don't await)
        paypalHelpers.sendNecessaryPayoutsForItemIds(itemIds);

        // Done!
        return res.status(200).send({ donationId });
      }

      // ---------- Stripe: Campaign Donation ---------- //
      else if (campaignInfo) {
        // Validate campaign info
        const { campaignId, quantity } = campaignInfo;
        const campaign = await campaignHelpers.getCampaignById(campaignId);
        if (!campaign) {
          console.log(`captureTransaction: could not find campaign with campaignId: ${campaignId}`);
          return res.sendStatus(404);
        }
        if (!quantity) {
          console.log(`captureTransaction: missing quantity from request body`);
          return res.status(400).send({ msg: `captureTransaction: missing quantity from request body` });
        }

        // Verify that campaign is still donatable
        if (campaign.quantityDonated >= campaign.quantityRequested) {
          const msg = `captureTransaction: full quantity (${campaign.quantityRequested}) for campaignHandle ${campaign.campaignHandle} already donated!`
          console.log(msg);
          return res.status(500).send({ msg });
        }
        if (quantity + campaign.quantityDonated > campaign.quantityRequested) {
          const msg = `captureTransaction: trying to donate too many items to campaignHandle ${campaign.campaignHandle}! 
            attempted quantity: ${quantity}. ${campaign.quantityDonated} out of ${campaign.quantityRequested} already donated`;
          console.log(msg);
          return res.status(500).send({ msg });
        }

        // Create donation entry
        const donationId = await donationHelpers.insertDonationIntoDB({
          donorInfo, campaignInfo,
          amount, bankTransferFee, serviceFee, paymentMethod
        });

        // Charge card
        let stripeOrderId, donorCountry;
        const chargeDescription = `Donation for campaignHandle: ${campaign.campaignHandle}`;
        try {
          const { payment_method_details, status, id } = await stripeHelpers.createStripeChargeForAmountUsd(amount, chargeDescription, stripeToken);
          stripeOrderId = id;
          donorCountry = payment_method_details.card.country;
        } catch (error) {
          console.log(`chargeTransaction: stripe error: ${error}`);
          donationHelpers.removeDonationFromDB(donationId);
          return res.status(500).send({ duetErrorCode: 'StripeError', error });
        }
        // Update donor_country, stripeOrderId
        await donationHelpers.setDonorCountry(donationId, donorCountry);
        await donationHelpers.setStripeOrderId(donationId, stripeOrderId);

        // Update quantity donated
        await campaignHelpers.incrementQuantityDonated(campaignId, quantity);

        // Send celebratory Slack message
        if (process.env.NODE_ENV === 'production') {
          slackHelpers.sendCampaignDonationMessage({ donorInfo, campaignInfo, campaign });
        }
        // Send email to donor (don't await)
        sendgridHelpers.sendCampaignThankYouEmail(donationId);

        // Done!
        return res.status(200).send({ donationId });
      }
    }

    // ---------- PayPal ---------- //
    if (paymentMethod === 'paypal') {
      // Validate input
      const { paypalOrderId } = req.body;
      if (!paypalOrderId) {
        console.log(`captureTransaction (paypal) -  missing paypalOrderId from request body`);
        return res.sendStatus(400);
      }

      // ---------- PayPal: Regular Item Donation ---------- //
      if (itemIds) {
        // Verify items are ready for transaction
        try {
          await itemHelpers.verifyItemsReadyForTransactionAndSetFlagsIfVerified(itemIds);
        } catch (error) {
          const raceCondItems = error.raceCondItems ? error.raceCondItems : [];
          const raceCondItemIds = raceCondItems.map(item => item.itemId);
          console.log(`DuetRaceCondition with raceCondItemIds: ${raceCondItemIds}`);
          return res.status(500).send({ duetErrorCode: "DuetRaceConditionError", error, raceCondItems });
        }

        // Capture paypal order
        let paypalCaptureResp;
        try {
          paypalCaptureResp = await paypalHelpers.capturePayPalOrder(paypalOrderId, amount);
        } catch (error) {
          console.log(`chargeTransaction: paypal error: ${error}`);
          await itemHelpers.unsetInCurrentTransactionFlagForItemIds(itemIds);
          donationHelpers.removeDonationFromDB(donationId);
          return res.status(500).send({ duetErrorCode: 'PayPalError', error });
        }
        const firstName = paypalCaptureResp.payer.name.given_name;
        const lastName = paypalCaptureResp.payer.name.surname;
        const email = paypalCaptureResp.payer.email_address;
        const donorInfo = { email, firstName, lastName };
        const donorCountry = paypalCaptureResp.payer.address.country_code;

        // Create donation entry
        const donationId = await donationHelpers.insertDonationIntoDB({
          donorInfo, donorCountry,
          amount, bankTransferFee, serviceFee,
          paymentMethod, paypalOrderId,
          honoreeInfo, referralCode
        });

        // Set item donation IDs
        await Promise.all(itemIds.map(async itemId => {
          await donationHelpers.markItemAsDonated(itemId, donationId);
          if (process.env.NODE_ENV === 'production') {
            slackHelpers.sendDonatedItemMessage(itemId);
          }
          const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
          if (itemObj) {
            sendgridHelpers.sendItemStatusUpdateEmail(itemObj);
          }
        }));

        // Unset flags
        await itemHelpers.unsetInCurrentTransactionFlagForItemIds(itemIds);

        // Send email to donor (don't await)
        sendgridHelpers.sendDonorThankYouEmailV3(donationId);

        // Send PayPal payout to stores with payment_method='paypal' (don't await)
        paypalHelpers.sendNecessaryPayoutsForItemIds(itemIds);

        // Done!
        return res.status(200).send({ donationId });
      }
      
      // ---------- PayPal: Campaign Donation ---------- //
      else if (campaignInfo) {
        // Validate campaign info
        const { campaignId, quantity } = campaignInfo;
        const campaign = await campaignHelpers.getCampaignById(campaignId);
        if (!campaign) {
          console.log(`captureTransaction: could not find campaign with campaignId: ${campaignId}`);
          return res.sendStatus(404);
        }
        if (!quantity) {
          console.log(`captureTransaction: missing quantity from request body`);
          return res.status(400).send({ msg: `captureTransaction: missing quantity from request body` });
        }

        // Verify that campaign is still donatable
        if (campaign.quantityDonated >= campaign.quantityRequested) {
          const msg = `captureTransaction: full quantity (${campaign.quantityRequested}) for campaignHandle ${campaign.campaignHandle} already donated!`
          console.log(msg);
          return res.status(500).send({ msg });
        }
        if (quantity + campaign.quantityDonated > campaign.quantityRequested) {
          const msg = `captureTransaction: trying to donate too many items to campaignHandle ${campaign.campaignHandle}! 
            attempted quantity: ${quantity}. ${campaign.quantityDonated} out of ${campaign.quantityRequested} already donated`;
          console.log(msg);
          return res.status(500).send({ msg });
        }

        // Capture paypal order
        let paypalCaptureResp;
        try {
          paypalCaptureResp = await paypalHelpers.capturePayPalOrder(paypalOrderId, amount);
        } catch (error) {
          console.log(`chargeTransaction: paypal error: ${error}`);
          await itemHelpers.unsetInCurrentTransactionFlagForItemIds(itemIds);
          donationHelpers.removeDonationFromDB(donationId);
          return res.status(500).send({ duetErrorCode: 'PayPalError', error });
        }
        const firstName = paypalCaptureResp.payer.name.given_name;
        const lastName = paypalCaptureResp.payer.name.surname;
        const email = paypalCaptureResp.payer.email_address;
        const donorInfo = { email, firstName, lastName };
        const donorCountry = paypalCaptureResp.payer.address.country_code;

        // Create donation entry
        const donationId = await donationHelpers.insertDonationIntoDB({
          donorInfo, donorCountry, campaignInfo,
          amount, bankTransferFee, serviceFee,
          paymentMethod, paypalOrderId
        });

        // Update quantity donated
        await campaignHelpers.incrementQuantityDonated(campaignId, quantity);

        // Send celebratory Slack message
        if (process.env.NODE_ENV === 'production') {
          slackHelpers.sendCampaignDonationMessage({ donorInfo, campaignInfo, campaign });
        }
        // Send email to donor (don't await)
        sendgridHelpers.sendCampaignThankYouEmail(donationId);

        // Done!
        return res.status(200).send({ donationId });
      }
    }
    
    // Unknown paymentMethod
    console.log(`captureTransaction - unknown paymentMethod: ${paymentMethod}`);
    return res.sendStatus(400);
    
  } catch (err) {
    errorHandler.handleError(err, "donate/captureTransaction");
    return res.sendStatus(500);
  }
}

async function createPayPalSubscription(req, res) {
  // return planId for a given amountUsd
  try {
    const planId = await paypalHelpers.getPayPalPlanIdForAmountUsd(req.body.amountUsd);
    return res.json({ 'paypalPlanId': planId });
  } catch (err) {
    errorHandler.handleError(err, "donate/getSubscriptionPlanId");
    return res.sendStatus(500);
  }
}

async function createSubscription(req, res) {
  // accept Stripe or PayPal
  try {
    const subscriptionInfo = req.body;
    console.log(`donate/processSuccessfulSubscription subscriptionInfo: ${JSON.stringify(subscriptionInfo)}`);
    let donationId;
    
    // paypal: using existing paypalSubscriptionId
    if (subscriptionInfo.paymentMethod === 'paypal') {
      // create DB entry
      donationId = await donationHelpers.insertSubscriptionIntoDB(
        subscriptionInfo.email,
        subscriptionInfo.firstName,
        subscriptionInfo.lastName,
        subscriptionInfo.amount,
        subscriptionInfo.bankTransferFee,
        subscriptionInfo.serviceFee,
        subscriptionInfo.country,
        subscriptionInfo.paypalSubscriptionId,
        stripeSubscription.id || null, // stripeSubscriptionId
        subscriptionInfo.paymentMethod
      );
    }
    // stripe: create new subscription
    else if (subscriptionInfo.paymentMethod === 'stripe') {
      // create stripe subscription
      const stripeSubscription = await stripeHelpers.createStripeSubscription(
        {
          email: subscriptionInfo.email,
          firstName: subscriptionInfo.firstName,
          lastName: subscriptionInfo.lastName,
          serviceFee: subscriptionInfo.serviceFee,
          country: subscriptionInfo.country,
          amount: subscriptionInfo.amount,
        }, 
        subscriptionInfo.stripePaymentMethodId, 
      );
    }
    else {
      throw new Error('No payment method declared');
    }
    console.log(`donate/createSubscription`);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "donate/createSubscription");
    return res.sendStatus(500);
  }
}

async function handleStripeWebhook(req, res) {
  let event;

  try {
    event = req.body;
  } catch (err) {
    res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Handle the event:
  switch(event.type) {
    case 'invoice.payment_succeeded':
      // recieved a payment tied to a subscription
      const invoice = event.data.object;
      const metadata = invoice.lines.data[0].metadata;

      // create DB entry:
      const donationId = donationHelpers.insertSubscriptionIntoDB(
        metadata.email,
        metadata.firstName,
        metadata.lastName,
        metadata.amount,
        metadata.bankTransferFee || null,
        metadata.serviceFee || null,
        metadata.country,
        metadata.paypalSubscriptionId || null, //paypalSubscriptionId
        invoice.subscription, // stripeSubscriptionId
        "stripe", //paymentMethod 
      );
      break;
    case 'customer.subscription.created':
      // subscription was created for the first time
      const subscription = event.data.object;

      // Send thank-you email to donor
      sendgridHelpers.sendSubscriptionThankYouEmail(subscription);
      break;
    default:
      // unexpected event type:
      return res.status(400).end(); 
  }

  return res.status(200).send();
}

async function sendDonationConfirmationEmail(req, res) {
  try {
    const donationId = req.body.donationId;
    await sendgridHelpers.sendDonorThankYouEmailV3(donationId);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "donate/createSubscription");
    return res.sendStatus(500);
  }
}

export default {
  // data models
  getDonation,

  // one-time donations
  captureTransaction,

  // subscriptions
  createPayPalSubscription,
  createSubscription,

  //stripe webhook
  handleStripeWebhook,

  // emails
  sendDonationConfirmationEmail
};
