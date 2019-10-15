// Imports
require("dotenv").config();
import config from '../util/config.js';
import errorHandler from './errorHandler.js';
import storeHelpers from '../util/storeHelpers.js';
import donorHelpers from './donorHelpers.js';
import itemHelpers from './itemHelpers.js';
import refugeeHelpers from './refugeeHelpers.js'

// -------------------- FACEBOOK MESSENGER -------------------- //

// Insert message into database
async function insertMessageIntoDB(message) {
  let source = message.source;
  let sender = message.sender;
  let recipient = message.recipient;
  let content = message.content;

  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
      [source, sender, recipient, content]
    );
    console.log("Successfully inserted message into database: %j", message);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelper/insertMessageIntoDB");
    throw err;
  }
}

// Get all info necessary to send a pickup notification
async function getFBMessengerInfoFromItemId(itemId) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "SELECT " +
      "item_name, pickup_code, item_photo_link, " + 
      "fb_psid, beneficiary_first, beneficiary_last, language, " +
      "store_name, " +
      "donor_first, donor_last, donor_country " +
      "FROM items_view " +
      "WHERE item_id=?",
      [itemId]
    );
    if (rows.length === 0) {
      console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);
      return null;
    }
    
    return rows[0];
    
  } catch (err) {
    errorHandler.handleError(err, "sqlHelper/getFBMessengerInfoFromItemId");
    throw err;
  }
}

// -------------------- DONORS -------------------- //

async function getDonorRowFromDonorEmail(donorEmail) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT * from donors_view WHERE donor_email=?",
      [donorEmail]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getDonorRowFromDonorEmail");
    throw err;
  }
}

async function getDonorObjFromDonorEmail(donorEmail) {
  try {
    let donorRow = await getDonorRowFromDonorEmail(donorEmail);
    if (!donorRow) {
      throw new Error(`getDonorObjFromDonorEmail: donor not found for email: ${donorEmail}`);
    }
    return donorHelpers.sqlRowToDonorObj(donorRow);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getDonorObjFromDonorEmail");
    throw err;
  }
}


// -------------------- DONATIONS -------------------- //

async function getDonationRow(donationId) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT * from donations WHERE donation_id=?",
      [donationId]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getDonationRow");
    throw err;
  }
}

async function insertDonationIntoDB(donationInfo) {
  // Insert donation info into DB, return insert ID
  let insertDonationQuery = "";
  let insertDonationValues = [];
  try {
    let conn = await config.dbInitConnectPromise();
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
    let [results, fields] = await conn.execute(insertDonationQuery, insertDonationValues);
    console.log("Successfully entered donation into DB: %j", donationInfo);
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/insertDonationIntoDB");
    throw err;
  }
}

async function markItemAsDonated(itemId, donationId) {
  // Mark item as donated, note that it requires store notification
  try {
    let conn = await config.dbInitConnectPromise();
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
    errorHandler.handleError(err, "sqlHelpers/markItemAsDoanted");
    throw err;
  }
}

// -------------------- TYPEFORM -------------------- //

async function insertItemFromTypeform(itemInfo) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,comment,status,store_id,link,in_notification) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?)",
      [itemInfo.itemNameEnglish,
        itemInfo.size,
        itemInfo.price,
        itemInfo.beneficiaryId,
        itemInfo.categoryId,
        itemInfo.comment,
        itemInfo.status,
        itemInfo.storeId,
        itemInfo.photoUrl,
        itemInfo.in_notification]
    );
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/insertItemFromTypeform");
    throw err;
  }
}

async function updateItemPickupCode(itemId, pickupCode) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET pickup_code=? WHERE item_id=?",
      [pickupCode, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemPickupCode");
    throw err;
  }
}

async function updateItemPhotoLink(itemId, photoUrl) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET link=? WHERE item_id=?",
      [photoUrl, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemPhotoLink");
    throw err;
  }
}

async function getItemNameTranslation(language, itemName) {
  // Get name_english, category_id from itemName in given language
  try {
    let conn = await config.dbInitConnectPromise();
    let [matchedItemNames, fields] = await conn.query(
      "SELECT name_english, category_id FROM item_types WHERE ?? LIKE ?",
      ["name_" + language, "%" + itemName + "%"]
    );
    return matchedItemNames[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemNameTranslation");
    throw err;
  }
}

// -------------------- PAYMENTS -------------------- //
function itemIdsGroupConcatStringToNumberList(itemIdsStr) {
  return itemIdsStr.split(",").map(Number);
}

async function getPayPalPayoutInfo(itemIds) {
  // Get stores' Payout info for list of items
  // Returns a list containing payout info for each store that we have to send a payout to
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "SELECT stores.paypal AS paypal, " +
      "stores.name AS store_name, " +
      "stores.email AS store_email, " +
      "payouts.payment_amount AS payment_amount, " +
      "payouts.item_ids AS item_ids " +
      "FROM stores AS stores " +
      "INNER JOIN (" +
      "SELECT store_id, " +
      "SUM(price_euros) AS payment_amount, " +
      "GROUP_CONCAT(item_id) AS item_ids " +
      "FROM items_view " +
      "WHERE item_id IN (?) " +
      "GROUP BY store_id" +
      ") AS payouts " +
      "USING(store_id) " +
      "WHERE stores.payment_method = 'paypal'",
      [itemIds]);

    return rows.map(singleStoreResult => ({
      ...singleStoreResult,
      item_ids: itemIdsGroupConcatStringToNumberList(singleStoreResult.item_ids)
    }));
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getPayPalPayoutInfo");
    throw err;
  }
}

async function getStoresNeedingBankTransfer() {
  // Returns a list containing bank transfer info for each store that we have to send a bank transfer to
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "SELECT stores.name AS store_name, " +
      "stores.email AS store_email, " +
      "stores.iban AS iban, " +
      "payouts.payment_amount AS payment_amount, " +
      "payouts.item_ids AS item_ids " +
      "FROM stores " +
      "INNER JOIN (" +
      "SELECT store_id, " +
      "SUM(price_euros) AS payment_amount, " +
      "GROUP_CONCAT(item_id) AS item_ids " +
      "FROM items_view " +
      "WHERE status = 'PAID' AND bank_transfer_sent = 0 " +
      "GROUP BY store_id" +
      ") AS payouts " +
      "USING(store_id) " +
      "WHERE stores.payment_method = 'transferwise'",
    );

    return rows.map(singleStoreResult => ({
      ...singleStoreResult,
      item_ids: itemIdsGroupConcatStringToNumberList(singleStoreResult.item_ids)
    }));
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoresNeedingBankTransfer");
    throw err;
  }
}

async function setBankTransferSentFlag(itemIds) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "UPDATE items " +
      "SET bank_transfer_sent = 1 " +
      "WHERE item_id IN (?)",
      [itemIds]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setBankTransferSentFlag");
    throw err;
  }
}

// -------------------- STORES -------------------- //
async function getStoreObjFromStoreId(storeId) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query("SELECT * from stores WHERE store_id=?", [storeId]);
    return storeHelpers.sqlRowToStoreObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreObjFromId");
    throw err;
  }
}

async function getStoreObjFromStoreEmail(storeEmail) {
  try {
    let [results, fields] = await conn.query("SELECT * from stores WHERE email=?", [storeEmail]);
    return storeHelpers.sqlRowToStoreObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreObjFromStoreEmail");
    throw err;
  }
}

async function getStoreIdFromName(storeName) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query("SELECT store_id FROM stores WHERE name=?", [storeName]);
    return results[0].store_id;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreIdFromName");
    throw err;
  }
}

async function getStoreInfoFromEmail(email) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT store_id, name, email FROM stores WHERE email=?",
      [email]
    );
    if (results.length === 0) {
      return null;
    } 
    return results[0];
    
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreInfoFromEmail");
    throw err;
  }
}

async function getStoresThatNeedNotification() {
  // Return a list of store objects that need notifying
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query("SELECT * from stores where needs_notification=1");
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoresThatNeedNotification");
    throw err;
  }
}

async function setStoreNotificationFlags(itemIds) {
  // Set store notification flag to 1 for all stores that interact with these items
  try {
    let conn = await config.dbInitConnectPromise();

    // Get list of all store IDs that need notification flag set
    let [storeIdResults, fields] = await conn.query(
      "SELECT store_id FROM items_view WHERE item_id IN (?)",
      [itemIds]);
    let storeIdsList = storeIdResults.map(storeIdResult => storeIdResult.store_id);

    // Set needs_notification to 1
    await conn.query(
      "UPDATE stores SET needs_notification=1 WHERE store_id IN (?) " +
      "AND payment_method='paypal'",
      [storeIdsList]);
    console.log(`Notification flag updated sucessfully for stores: ${storeIdsList}`)
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setStoreNotificationFlags");
    throw err;
  }
}

async function setSingleStoreNotificationFlag(storeId) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=1 where store_id=?",
      [storeId]
    );
    console.log("Set store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setSingleStoreNotificationFlag");
    throw err;
  }
}

async function unsetSingleStoreNotificationFlag(storeId) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=0 where store_id=?",
      [storeId]
    );
    console.log("Unset store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/unsetSingleStoreNotificationFlag");
    throw err;
  }
}

async function resetAllStoreNotificationFlags() {
  // Reset all stores' notification flags
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=0");
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/resetAllStoreNotificationFlags");
    throw err;
  }
}

async function getItemsForNotificationEmail(store_id) {
  // Get items to notify the given store about
  try {
    let conn = await config.dbInitConnectPromise();
    let updatedItems = [];
    let [results, fields] = await conn.query(
      "SELECT item_id, item_photo_link, item_name, price_euros " + 
      "FROM items_view where store_id=? and in_notification=1",
      [store_id]
    );
    if (results.length === 0) {
      console.log("sqlHelpers/getItemsForNotificationEmail: No items included in notification");
    }
    else {
      let item;
      results.forEach(function (obj) {
        item = {
          itemId: obj.item_id,
          itemImage: obj.item_photo_link,
          itemName: obj.item_name,
          itemPrice: obj.price_euros,
        }
        updatedItems.push(item);
      });
    }
    return updatedItems;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsForNotificationEmail");
    throw err;
  }
}

// -------------------- ITEMS -------------------- //
let itemsQuery = "SELECT * FROM items_view";

async function getItemRow(itemId) {
  // Get single item
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE item_id=?",
      [itemId]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemRow");
    throw err;
  }
}

async function getItemRows(itemIds) {
  // Get a list of items
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE item_id IN (?)",
      [itemIds]
    );
    if (results.length === 0) {
      return [];
    }
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemRows");
    throw err;
  }
}

async function getItemObjFromItemId(itemId) {
  try {
    let row = await getItemRow(itemId);
    if (!row) {
      throw new Error(`getItemObjFromItemId: item not found for itemId: ${itemId}`);
    }
    return itemHelpers.sqlRowToItemObj(row);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemObjFromItemId");
    throw err;
  }
}

async function getItemObjsFromItemIds(itemIds) {
  try {
    let rows = await getItemRows(itemIds);
    return rows.map(row => itemHelpers.sqlRowToItemObj(row));
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemObjsFromItemIds");
    throw err;
  }
}

async function getItemsForStore(storeId) {
  // Get all items associated with this storeId
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE store_id=?",
      [storeId]
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsForStore");
    throw err;
  }
}

async function getItemsForDonation(donationId) {
  // Get all items associated with this donationId
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery
      + " INNER JOIN donations USING(donation_id) WHERE donation_id=?",
      [donationId]
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsForDonation");
    throw err;
  }
}

async function getAllItems() {
  // Get all items
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery
    );
    if (results.length === 0) {
      return null;
    }
    
    return results;
    
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getAllItems");
    throw err;
  }
}

async function getItemsWithStatus(status) {
  // Get all items associated with this store
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE status=?",
      [status]
    );
    if (results.length === 0) {
      return [];
    }
    
    return results;
    
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsWithStatus");
    throw err;
  }
}

async function updateItemStatus(newStatus, itemId) {
  try {
    let conn = await config.dbInitConnectPromise();
    if (newStatus === "PAID") {
      await conn.query(
        `UPDATE items SET status=?, in_notification=1 WHERE item_id = ?`,
        [newStatus, itemId]
      );
    } else {
      await conn.query(
        `UPDATE items SET status=? WHERE item_id = ?`,
        [newStatus, itemId]
      );
    }
    console.log("Successfully updated item status to " + newStatus + " for item " + itemId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemStatus");
    throw err;
  }
}


async function setItemNotificationFlag(item_id) {
  // Mark single item as needing a notification
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=1 where item_id = ?`,
      [item_id]
    );
    console.log("Set notification flag for item " + item_id);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setItemNotificationFlag");
    throw err;
  }
}

async function unsetItemsNotificationFlag(item_ids) {
  // Mark all items in item_ids as no longer needing notification (after sending batch email)
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=0 where item_id IN (?)`,
      [item_ids]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/unsetItemsNotificationFlag");
    throw err;
  }
}


// -------------------- BENEFICIARIES -------------------- //

async function getBeneficiaryRow(beneficiaryId) {
  // Get beneficiary info for 1 beneficiary
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT * FROM beneficiaries_view WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getBeneficiaryRow");
    throw err;
  }
}

async function getBeneficiaryObjFromBeneficiaryId(beneficiaryId) {
  try {
    const row = await getBeneficiaryRow(beneficiaryId);
    if (!row) {
      throw new Error(`getBeneficiaryObjFromBeneficiaryId: beneficiary not found for beneficiaryId: ${beneficiaryId}`);
    }
    return refugeeHelpers.sqlRowToBeneficiaryObj(row);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getBeneficiaryObjFromBeneficiaryId");
    throw err;
  }
}

async function getBeneficiaryNeeds(beneficiaryId) {
  // Get item needs for 1 beneficiary
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT * FROM items_view WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getBeneficiaryNeeds");
    throw err;
  }
}

async function getAllBeneficiaryInfoAndNeeds() {
  // Get beneficiary info and needs for all beneficiaries
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT * FROM beneficiaries_and_items_view"
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getAllBeneficiaryInfoAndNeeds");
    throw err;
  }
}


export default {
  // FACEBOOK MESSENGER
  insertMessageIntoDB,
  getFBMessengerInfoFromItemId,

  // DONORS
  getDonorRowFromDonorEmail,
  getDonorObjFromDonorEmail,

  // DONATIONS
  getDonationRow,
  markItemAsDonated,
  insertDonationIntoDB,

  // TYPEFORM
  getItemNameTranslation,
  insertItemFromTypeform,
  updateItemPickupCode,
  updateItemPhotoLink,

  // PAYMENTS
  getPayPalPayoutInfo,
  getStoresNeedingBankTransfer,
  setBankTransferSentFlag,

  // STORES
  getStoreObjFromStoreId,
  getStoreObjFromStoreEmail,
  getStoreIdFromName,
  getStoreInfoFromEmail,
  getStoresThatNeedNotification,
  setStoreNotificationFlags,
  setSingleStoreNotificationFlag,
  unsetSingleStoreNotificationFlag,
  resetAllStoreNotificationFlags,
  getItemsForNotificationEmail,
  unsetItemsNotificationFlag,

  // ITEMS
  getItemObjFromItemId,
  getItemObjsFromItemIds,
  getItemRow,
  getItemRows,
  getItemsForStore,
  getItemsForDonation,
  getAllItems,
  getItemsWithStatus,
  updateItemStatus,
  setItemNotificationFlag,
  unsetItemsNotificationFlag,

  // BENEFICIARIES
  getBeneficiaryRow,
  getBeneficiaryObjFromBeneficiaryId,
  getBeneficiaryNeeds,
  getAllBeneficiaryInfoAndNeeds
}
