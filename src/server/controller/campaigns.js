// Imports
import campaignHelpers from "../util/campaignHelpers.js";
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

export default {
  getCampaign
};
