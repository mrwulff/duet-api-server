// Imports
import campaignHelpers from "../util/campaignHelpers.js";
import donationHelpers from "../util/donationHelpers.js";
import stripeHelpers from "../util/stripeHelpers.js";
import errorHandler from "../util/errorHandler.js";

async function getCampaign(req, res) {
  try {
    // Get campaign by handle (e.g. /api/campaigns/kara-tepe)
    if (req.params && req.params.campaignHandle) {
      const campaign = await campaignHelpers.getCampaignByHandle(req.params.campaignHandle);
      if (!campaign) {
        return res.status(404).send();
      }
      return res.json(campaign);
    }
    // Get all campaigns
    const campaigns = await campaignHelpers.getAllCampaigns();
    return res.json(campaigns);
  } catch (err) {
    errorHandler.handleError(err, "campaigns/getCampaign");
    return res.status(500).send();
  }
}

async function captureCampaignTransaction(req, res) {
  try {
    // Validate input
    if (!req.params || !req.params.campaignHandle) {
      return res.sendStatus(404);
    }

    
    const { campaignHandle } = req.params;
    const campaign = await campaignHelpers.getCampaignByHandle(campaignHandle);
    if (!campaign) {
      console.log(`captureCampaignTransaction: could not find campaign with handle: ${campaignHandle}`);
      return res.sendStatus(404);
    }
    const { paymentMethod, stripeToken, donorInfo, quantity } = req.body;
    if (paymentMethod === 'stripe') {
      console.log(`captureCampaignTransaction: paymentMethod must be equal to 'stripe'!`);
      return res.status(400).send({ msg: `captureCampaignTransaction: paymentMethod must be equal to 'stripe'!` });
    }
    if (!stripeToken) {
      console.log(`captureCampaignTransaction: missing stripeToken from request body`);
      return res.status(400).send({ msg: `captureCampaignTransaction: missing stripeToken from request body` });
    }
    if (!quantity) {
      console.log(`captureCampaignTransaction: missing quantity from request body`);
      return res.status(400).send({ msg: `captureCampaignTransaction: missing quantity from request body` });
    }
    if (!donorInfo || !donorInfo.email || !donorInfo.firstName || !donorInfo.lastName) {
      console.log(`captureCampaignTransaction: donorInfo has missing fields: ${JSON.stringify(donorInfo)}`);
      return res.status(400).send({ msg: `captureCampaignTransaction: donorInfo has missing fields` });
    }

    // Verify that campaign is still donatable
    if (campaign.quantityDonated >= campaign.quantityRequested) {
      const msg = `captureCampaignTransaction: full quantity (${campaign.quantityRequested}) for ${campaignHandle} already donated!`
      console.log(msg);
      return res.status(500).send({ msg });
    }
    if (quantity + campaign.quantityDonated > campaign.quantityRequested) {
      const msg = `captureCampaignTransaction: trying to donate too many items to ${campaignHandle}! 
        attempted quantity: ${quantity}. ${campaign.quantityDonated} out of ${campaign.quantityRequested} already donated`;
      console.log(msg);
      return res.status(500).send({ msg });
    }

    // Create donation entry
    const donationId = await campaignHelpers.insertCampaignDonationIntoDB(); // TODO

    // Charge card
    let stripeOrderId, donorCountry;
    const chargeDescription = `Donation for item ids: ${itemIds}`;
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
    await campaignHelpers.incrementQuantityDonated(campaignHandle, quantity);

    // TODO: send celebratory Slack message

    // TODO: Send email to donor (don't await)
    sendgridHelpers.sendDonorThankYouEmailV3(donationId);

    // Done!
    return res.status(200).send({ donationId });

  } catch (err) {
    errorHandler.handleError(err, "campaigns/captureCampaignTransaction");
    return res.status(500).send();
  }
}

export default {
  getCampaign,
  captureCampaignTransaction
};
