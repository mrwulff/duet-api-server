import sqlHelpers from '../util/sqlHelpers.js';
import donorHelpers from '../util/donorHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from '../util/errorHandler.js';

function getFrontEndDonationObj(donationRow, donorObj, itemObjs) {
  let donationObj = {
    donationId: Number(donationRow.donation_id),
    donationTimestamp: donationRow.donation_timestamp,
    donor: donorObj,
    items: itemObjs
  };
  return donationObj;
}

async function getDonationObjFromDonationId(donationId) {
  try {
    // get donation (and donor) info
    let donationResult = await sqlHelpers.getDonationInfo(donationId);
    let donor = donorHelpers.getFrontEndDonorObj(donationResult);
    // get items associated with donation
    let items = await sqlHelpers.getItemsForDonation(donationId);
    items = items.map(item => itemHelpers.getFrontEndItemObj(item));
    // create and return donation object
    let donationObj = getFrontEndDonationObj(donationResult, donor, items);
    return donationObj;
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/getDonationObjFromDonationId");
    throw err;
  }
}

export default {
  getDonationObjFromDonationId
}