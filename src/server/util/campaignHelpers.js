// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';

function campaignRowToCampaignObj(row) {
  // TODO
  const campaignObj = null;
  return campaignObj;
}

async function getAllCampaigns() {
  try {
    const conn = await config.dbInitConnectPromise();
    const results = []; // TODO
    return results.map(campaignRowToCampaignObj);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/getAllCampaigns");
    throw err;
  }
}

async function getCampaignByHandle(campaignHandle) {
  try {
    const conn = await config.dbInitConnectPromise();
    const results = []; // TODO
    if (!results.length) {
      return null;
    }
    return campaignRowToCampaignObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/getCampaignByHandle");
    throw err;
  }
}

async function incrementQuantityDonated(campaignHandle, quantity) {
  // Increment quantity donated by 'quantity'
  try {
    const conn = await config.dbInitConnectPromise();
    // TODO: increment, return new quantity
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/incrementQuantityDonated");
    throw err;
  }
}

async function insertCampaignDonationIntoDB() {
  // TODO: do we need this?
}

export default {
  // getters
  getAllCampaigns,
  getCampaign,

  // donations
  incrementQuantityDonated,
  insertCampaignDonationIntoDB
};
