import sqlHelpers from '../util/sqlHelpers.js';
import donorHelpers from '../util/donorHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from '../util/errorHandler.js';

function sqlRowToDonationObj(donationRow, donorObj, itemObjs) {
  const donationObj = {
    donationId: Number(donationRow.donation_id),
    donationTimestamp: donationRow.donation_timestamp,
    donationAmtUsd: donationRow.donation_amt_usd,
    donor: donorObj,
    items: itemObjs
  };
  return donationObj;
}

async function getDonationObjFromDonationId(donationId) {
  try {
    // get donation (and donor) info
    const donationResult = await sqlHelpers.getDonationRow(donationId);
    const donor = donorHelpers.sqlRowToDonorObj(donationResult);
    // get items associated with donation
    let items = await sqlHelpers.getItemsForDonation(donationId);
    items = items.map(item => itemHelpers.sqlRowToItemObj(item));
    // create and return donation object
    const donationObj = sqlRowToDonationObj(donationResult, donor, items);
    return donationObj;
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/getDonationObjFromDonationId");
    throw err;
  }
}

export default {
  sqlRowToDonationObj,
  getDonationObjFromDonationId
}