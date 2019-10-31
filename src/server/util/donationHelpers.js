import config from '../util/config.js';
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
    // get donation (and donor) info from DB
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * from donations WHERE donation_id=?",
      [donationId]
    );
    if (results.length === 0) {
      return null;
    }
    const donationRow = results[0];
    const donor = donorHelpers.sqlRowToDonorObj(results[0]);
    // get items associated with donation
    const items = await getItemObjsForDonationId(donationId);
    // create and return donation object
    const donationObj = sqlRowToDonationObj(donationRow, donor, items);
    return donationObj;
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/getDonationObjFromDonationId");
    throw err;
  }
}

async function getItemObjsForDonationId(donationId) {
  // Get all items associated with this donationId
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM items_view INNER JOIN donations USING(donation_id) WHERE donation_id=?",
      [donationId]
    );
    return results.map(itemHelpers.sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/getItemObjsForDonationId");
    throw err;
  }
}

async function markItemAsDonated(itemId, donationId) {
  // Mark item as donated, note that it requires store notification
  try {
    const conn = await config.dbInitConnectPromise();
    // ensure donation_id does not yet exist (could signal a race condition)
    const [results, fields] = await conn.query("SELECT donation_id FROM items WHERE item_id=?", itemId);
    if (results[0].donation_id) {
      console.log("markItemAsDonated WARNING: Possible race condition! donation_id is already set. " +
        `itemId: ${itemId}. donationId: ${results[0].donation_id}`);
    }
    // set donation_id
    await conn.query(
      "UPDATE items " +
      "INNER JOIN stores USING(store_id) " +
      "SET status='PAID', " +
      "donation_id=? " +
      // "in_notification=CASE payment_method WHEN 'paypal' THEN 1 ELSE in_notification END " +
      "WHERE item_id=?",
      [donationId, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/markItemAsDoanted");
    throw err;
  }
}

async function insertDonationIntoDB(donationInfo) {
  // TODO: clean this up
  // Insert donation info into DB, return insert ID
  let insertDonationQuery = "";
  let insertDonationValues = [];
  try {
    const conn = await config.dbInitConnectPromise();
    if (donationInfo.email) {
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?,?)";
      insertDonationValues = [
        donationInfo.firstName,
        donationInfo.lastName,
        donationInfo.email,
        donationInfo.amount,
        donationInfo.bankTransferFee,
        donationInfo.serviceFee,
        donationInfo.country
      ]
    } else {
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?)";
      insertDonationValues = [
        donationInfo.firstName,
        donationInfo.lastName,
        donationInfo.amount,
        donationInfo.bankTransferFee,
        donationInfo.serviceFee,
        donationInfo.country
      ]
    }
    const [results, fields] = await conn.execute(insertDonationQuery, insertDonationValues);
    console.log("Successfully entered donation into DB: %j", donationInfo);
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/insertDonationIntoDB");
    throw err;
  }
}

export default {
  sqlRowToDonationObj,
  getDonationObjFromDonationId,
  markItemAsDonated,
  insertDonationIntoDB,
}