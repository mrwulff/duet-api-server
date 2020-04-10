// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';

function campaignRowToCampaignObj(row) {
  const campaignObj = {
    campaignId: Number(row.campaign_id),
    campaignHandle: row.campaign_handle,
    quantityRequested: Number(row.quantity_requested),
    quantityDonated: Number(row.quantity_donated),
    unitPrice: {
      amount: Number(row.item_unit_price),
      currency: row.item_currency
    }
  };
  return campaignObj;
}

async function getAllCampaigns() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query("SELECT * from campaigns");
    return results.map(campaignRowToCampaignObj);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/getAllCampaigns");
    throw err;
  }
}

async function getCampaignById(campaignId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(
      "SELECT * from campaigns where campaign_id = ?",
      [campaignId]
    );
    if (!results.length) {
      return null;
    }
    return campaignRowToCampaignObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/getCampaignById");
    throw err;
  }
}

async function getCampaignByHandle(campaignHandle) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(
      "SELECT * from campaigns where campaign_handle = ?",
      [campaignHandle]
      );
    if (!results.length) {
      return null;
    }
    return campaignRowToCampaignObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/getCampaignByHandle");
    throw err;
  }
}

async function incrementQuantityDonated(campaignId, quantity) {
  // Increment quantity donated by 'quantity'
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE campaigns 
      SET quantity_donated = quantity_donated + ? 
      WHERE campaign_id = ?`,
      [quantity, campaignId]);
    console.log(`campaignHelpers/incrementQuantityDonated: increased quantity donated by ${quantity} for campaignId ${campaignId}`);
  } catch (err) {
    errorHandler.handleError(err, "campaignHelpers/incrementQuantityDonated");
    throw err;
  }
}

export default {
  // getters
  getAllCampaigns,
  getCampaignById,
  getCampaignByHandle,

  // updaters
  incrementQuantityDonated
};
