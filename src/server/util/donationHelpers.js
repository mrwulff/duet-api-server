import config from '../util/config.js';
import donorHelpers from '../util/donorHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from '../util/errorHandler.js';

function sqlRowToDonationObj(donationRow, donorObj, itemObjs) {
  const donationObj = {
    donationId: Number(donationRow.donation_id),
    donationTimestamp: donationRow.timestamp,
    donationAmtUsd: Number(donationRow.donation_amt_usd),
    bankTransferFeeUsd: Number(donationRow.bank_transfer_fee_usd),
    serviceFeeUsd: Number(donationRow.service_fee_usd),
    isSubscription: donationRow.is_subscription,
    donor: donorObj,
    items: itemObjs,
    onBehalfOfEmail: donationRow.on_behalf_of_email,
    onBehalfOfFirst: donorHelpers.capitalizeAndTrimName(donationRow.on_behalf_of_fname),
    onBehalfOfLast: donorHelpers.capitalizeAndTrimName(donationRow.on_behalf_of_lname),
    onBehalfOfMessage: donationRow.on_behalf_of_message
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

async function insertDonationIntoDB({
    donorInfo, donorCountry,
    amount, bankTransferFee, serviceFee,
    paypalOrderId, stripeOrderId, paymentMethod,
    honoreeInfo, referralCode, campaignInfo
  } = {}) {
  // Insert donation info into DB, return insert ID
  // donorInfo: { email, firstName, lastName }
  // honoreeInfo (optional): { honoreeEmail, honoreeFirst, honoreeLast, honoreeMessage }
  // campaignInfo (optional): { campaignId, quantity }
  try {
    const { email, firstName, lastName } = donorInfo;
    const { campaignId, quantity } = campaignInfo || {};
    const { honoreeEmail, honoreeFirst, honoreeLast, honoreeMessage } = honoreeInfo || {};
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      `INSERT INTO donations (timestamp,donor_email,donor_fname,donor_lname,donation_amt_usd, 
      bank_transfer_fee_usd,service_fee_usd,donor_country,paypal_order_id,stripe_order_id,payment_method, 
      on_behalf_of_email,on_behalf_of_fname,on_behalf_of_lname,on_behalf_of_message, referral_code,
      campaign_id, campaign_item_quantity) 
      VALUES (NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        email,
        firstName,
        lastName,
        amount,
        bankTransferFee,
        serviceFee,
        donorCountry,
        paypalOrderId,
        stripeOrderId,
        paymentMethod,
        honoreeEmail,
        honoreeFirst,
        honoreeLast,
        honoreeMessage,
        referralCode,
        campaignId,
        quantity
      ]
    );
    const donationId = results.insertId;
    console.log(`Successfully entered donation into DB: donationId: ${donationId}`);
    return donationId;
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/insertDonationIntoDB");
    throw err;
  }
}

// TODO: delete this
// async function insertDonationIntoDB(
//   email, firstName, lastName, 
//   amount, bankTransferFee, serviceFee, 
//   country, paypalOrderId, stripeOrderId, paymentMethod,
//   onBehalfOfEmail, onBehalfOfFirst, onBehalfOfLast, onBehalfOfMessage, referralCode
// ) {
//   // Insert donation info into DB, return insert ID
//   try {
//     const conn = await config.dbInitConnectPromise();
//     const [results, fields] = await conn.query(
//       "INSERT INTO donations (timestamp,donor_email,donor_fname,donor_lname,donation_amt_usd," +
//       "bank_transfer_fee_usd,service_fee_usd,donor_country,paypal_order_id,stripe_order_id,payment_method," +
//       "on_behalf_of_email,on_behalf_of_fname,on_behalf_of_lname,on_behalf_of_message, referral_code) " +
//       "VALUES (NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
//       [
//         email,
//         firstName,
//         lastName,
//         amount,
//         bankTransferFee,
//         serviceFee,
//         country,
//         paypalOrderId,
//         stripeOrderId,
//         paymentMethod,
//         onBehalfOfEmail,
//         onBehalfOfFirst,
//         onBehalfOfLast,
//         onBehalfOfMessage,
//         referralCode,
//       ]
//     );
//     const donationId = results.insertId;
//     console.log(`Successfully entered donation into DB: donationId: ${donationId}`);
//     return donationId;
//   } catch (err) {
//     errorHandler.handleError(err, "donationHelpers/insertDonationIntoDB");
//     throw err;
//   }
// }

async function removeDonationFromDB(donationId) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("DELETE FROM donations where donation_id=?", [donationId]);
    console.log(`Successfully removed donation ${donationId} from database`);
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/removeDonationFromDb");
    throw err;
  }
}

async function setDonorCountry(donationId, donorCountry) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE donations SET donor_country=? WHERE donation_id=?",
      [donorCountry, donationId]);
    console.log(`donationHelpers/setDonationDonorCountry: successfully set donorCountry to ${donorCountry} for donation ${donationId}`);
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/setDonationDonorCountry");
    throw err;
  }
}

async function setStripeOrderId(donationId, stripeOrderId) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE donations SET stripe_order_id=? WHERE donation_id=?",
      [stripeOrderId, donationId]);
    console.log(`donationHelpers/setStripeOrderId: successfully set stripeOrderId to ${stripeOrderId} for donation ${donationId}`);
  } catch (err) {
    errorHandler.handleError(err, "donationHelpers/setStripeOrderId");
    throw err;
  }
}

async function insertSubscriptionIntoDB(email, firstName, lastName, amount, bankTransferFee, serviceFee, country, 
  paypalSubscriptionId, stripeSubscriptionId, paymentMethod) {
  // Insert subscription info into DB, return insert ID
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "INSERT INTO donations (timestamp,donor_email,donor_fname,donor_lname,donation_amt_usd," +
      "bank_transfer_fee_usd,service_fee_usd,donor_country,paypal_subscription_id,stripe_subscription_id,payment_method,is_subscription) " +
      "VALUES (NOW(),?,?,?,?,?,?,?,?,?,?,1)",
      [
        email,
        firstName,
        lastName,
        amount,
        bankTransferFee,
        serviceFee,
        country,
        paypalSubscriptionId,
        stripeSubscriptionId,
        paymentMethod
      ]
    );
    const subscriptionId = results.insertId;
    console.log(`Successfully entered subscription into DB. subscriptionId: ${subscriptionId}`);
    return subscriptionId;
  } catch (err) {
    errorHandler.handleError(err, "subscriptionHelpers/insertSubscriptionIntoDB");
    throw err;
  }
}

export default {
  // data modeling
  sqlRowToDonationObj,
  getDonationObjFromDonationId,

  // insert/remove donation/subscription
  insertDonationIntoDB,
  removeDonationFromDB,
  insertSubscriptionIntoDB,

  // update existing donation
  setDonorCountry,
  setStripeOrderId,

  // other helpers
  markItemAsDonated,
};
