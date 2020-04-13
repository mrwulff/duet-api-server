// Imports
import rp from 'request-promise';
import itemHelpers from './itemHelpers.js';
import errorHandler from './errorHandler.js';

async function sendNewItemRequestSlackMessage(itemId) {
  try {
    const item = await itemHelpers.getItemObjFromItemId(itemId);
    // format message
    let messageText = `*itemId: ${itemId}* (${item.pickupCode})\n`;
    messageText += `name: ${item.name}\nprice: ${item.price.toFixed(2)}€\n`;
    messageText += `beneficiary: ${item.beneficiaryLast} (${item.beneficiaryId})\n`;
    messageText += `store: ${item.storeName}\nstatus: ${item.status}\nimage: ${item.image}\n`;
    if (item.priceTagImage) {
      messageText += `priceTagImage: ${item.priceTagImage}\n`;
    }
    if (item.size) {
      messageText += `size: ${item.size}\n`;
    }
    if (item.comment) {
      messageText += `comment: ${item.comment}\n`;
    }
    await rp({
      method: 'POST',
      uri: process.env.SLACK_NEW_ITEM_REQUEST_WEBHOOK,
      headers: { 'Content-Type': 'application/json' },
      body: { text: messageText },
      json: true
    });
    await rp({
      method: 'POST',
      uri: process.env.SLACK_NEW_ITEM_REQUEST_WEBHOOK_2,
      headers: { 'Content-Type': 'application/json' },
      body: { text: messageText },
      json: true
    });
    console.log(`Successfully sent slack message for new item request: ${itemId}`);
  } catch (err) {
    errorHandler.handleError(err, "slackHelpers/sendNewItemRequestSlackMessage");
    throw err;
  }
}

async function sendDonatedItemMessage(itemId) {
  try {
    const item = await itemHelpers.getItemObjFromItemId(itemId);
    // format message
    let messageText = `:tada: *${item.name} for ${item.beneficiaryLast} (${item.beneficiaryId})* :tada:\n`;
    messageText += `donor: ${item.donorFirst} ${item.donorLast} (${item.donorEmail}, ${item.donorCountry})\n`;
    messageText += `itemId: ${itemId} (${item.pickupCode})\n`;
    messageText += `price: ${item.price.toFixed(2)}€\n`;
    messageText += `store: ${item.storeName}\n`;
    if (item.comment) {
      messageText += `comment: ${item.comment}\n`;
    }
    messageText += `image: ${item.image}`;
    await rp({
      method: 'POST',
      uri: process.env.SLACK_DONATED_ITEM_WEBHOOK,
      headers: { 'Content-Type': 'application/json' },
      body: { text: messageText },
      json: true
    });
    console.log(`Successfully sent slack message for donated item: ${itemId}`);
  } catch (err) {
    errorHandler.handleError(err, "slackHelpers/sendDonatedItemMessage");
    throw err;
  }
}

async function sendCampaignDonationMessage({ donorInfo, campaignInfo, campaign }) {
  try {
    let messageText = `:tada: *+${campaignInfo.quantity} for ${campaign.campaignHandle} campaign* :tada:\n`;
    messageText += `donor: ${donorInfo.firstName} ${donorInfo.lastName} (${donorInfo.email})\n`;
    await rp({
      method: 'POST',
      uri: process.env.SLACK_DONATED_ITEM_WEBHOOK,
      headers: { 'Content-Type': 'application/json' },
      body: { text: messageText },
      json: true
    });
    console.log(`Successfully sent slack message for campaign: ${campaign.campaignHandle}`);
  } catch (err) {
    errorHandler.handleError(err, "slackHelpers/sendCampaignDonationMessage");
    throw err;
  }
}

export default {
  sendNewItemRequestSlackMessage,
  sendDonatedItemMessage,
  sendCampaignDonationMessage
};
