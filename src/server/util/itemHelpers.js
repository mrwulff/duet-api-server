// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';

function sqlRowToItemObj(row) {
  // SQL row to item object
  const itemObj = {
    itemId: row.item_id,
    image: row.item_photo_link,
    name: row.item_name,
    size: row.size,
    price: row.price_euros,
    comment: row.comment,
    storeId: row.store_id,
    storeName: row.store_name,
    storeMapsLink: row.store_maps_link,
    icon: row.icon_url,
    status: row.status,
    pickupCode: row.pickup_code,
    requestedTimestamp: row.requested_timestamp,
    beneficiaryId: row.beneficiary_id,
    beneficiaryFirst: row.beneficiary_first,
    beneficiaryLast: row.beneficiary_last,
    donorFirst: row.donor_first,
    donorLast: row.donor_last,
    donorEmail: row.donor_email,
    donorCountry: row.donor_country,
    donationTimestamp: row.donation_timestamp,
  }
  return itemObj;
}

async function getItemObjFromItemId(itemId) {
  try {
    // single item
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * from items_view WHERE item_id = ?",
      [itemId]
    );
    if (results.length === 0) {
      return null;
    }
    return sqlRowToItemObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/getItemObjFromItemId");
    throw err;
  }
}

async function getItemObjsFromItemIds(itemIds) {
  try {
    // single item
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * from items_view WHERE item_id IN (?)",
      [itemIds]
    );
    return results.map(sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/getItemObjsFromItemIds");
    throw err;
  }
}

async function getAllItemObjs() {
  try {
    // single item
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query("SELECT * from items_view");
    return results.map(sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/getAllItemObjs");
    throw err;
  }
}

async function getItemObjsWithStatus(status) {
  // Get all items associated with this store
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM items_view WHERE status=?",
      [status]
    );
    return results.map(sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/getItemObjsWithStatus");
    throw err;
  }
}

async function updateSingleItemStatus(newStatus, itemId) {
  try {
    const conn = await config.dbInitConnectPromise();
    if (newStatus === "PAID") {
      await conn.query(
        `UPDATE items SET status=?, in_notification=1 WHERE item_id = ?`,
        [newStatus, itemId]
      );
    } else if (newStatus === "READY_FOR_PICKUP") {
      await conn.query(
        `UPDATE items SET status=?, ready_for_pickup_timestamp=NOW() WHERE item_id = ?`,
        [newStatus, itemId]
      );
    } else if (newStatus === "PICKED_UP") {
      await conn.query(
        `UPDATE items SET status=?, picked_up_timestamp=NOW() WHERE item_id = ?`,
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
    errorHandler.handleError(err, "itemHelpers/updateSingleItemStatus");
    throw err;
  }
}

async function verifyItemsReadyForTransactionAndSetFlagsIfVerified(itemIds) {
  const connPool = await config.dbInitConnectPromise();
  const conn = await connPool.getConnection();
  try {
    await conn.beginTransaction();
    // check in_current_transaction flags, throw error if already set
    const [results, fields] = await conn.query(
      "SELECT " +
      "MAX(in_current_transaction) AS any_item_in_transaction, " +
      "SUM(CASE WHEN status != 'VERIFIED' THEN 1 ELSE 0 END) AS num_non_verified " +
      "FROM items WHERE item_id IN (?)",
      [itemIds]
    );
    if (results[0].any_item_in_transaction || results[0].num_non_verified > 0) {
      throw new Error(`DuetRaceConditionError detected for itemIds: ${itemIds}`);
    }
    // set in_current_transaction flags and commit transaction
    await conn.query(
      "UPDATE items SET in_current_transaction=1, " +
      "in_current_transaction_timestamp=CURRENT_TIMESTAMP " +
      "WHERE item_id in (?)",
      [itemIds]
    );
    await conn.commit();
    await conn.release();
  } catch (err) {
    // rollback, release connection, throw error up the stack
    await conn.rollback();
    await conn.release();
    errorHandler.handleError(err, "itemHelpers/verifyItemsReadyForTransaction");
    throw err;
  }
}

async function unsetInCurrentTransactionFlagForItemIds(itemIds) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET in_current_transaction=0, " + 
      "in_current_transaction_timestamp=NULL " + 
      "WHERE item_id IN (?)",
      [itemIds]
    );
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/unsetInCurrentTransactionFlagForItemIds");
    throw err;
  }
}

async function getItemIdsWithStaleInCurrentTransactionTimestamp() {
  // get itemIds where in_current_transaction flag has been set for more than 10 minutes
  try {
    const staleMinutes = 10;
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT item_id FROM items " + 
      "WHERE in_current_transaction=1 " + 
      "AND in_current_transaction_timestamp < DATE_SUB(NOW(), INTERVAL ? MINUTE)",
      [staleMinutes]
    );
    return results.map(row => row.item_id);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/getItemIdsWithStaleInCurrentTransactionTimestamp");
    throw err;
  }
}

function generatePickupCode(itemId) {
  let code = "DUET-";
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // append 2 random letters to code
  for (let i = 0; i < 2; i++) {
    code += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  // append item id
  code += itemId;
  return code;
}

function itemIdsListToString(itemIdsList) {
  var itemIdsStr = itemIdsList.map(id => `#${id}`); // e.g. ["#63", "#43"]
  itemIdsStr = itemIdsStr.join(", "); // e.g. "#79, #75, #10"
  return itemIdsStr;
}

function itemIdsGroupConcatStringToNumberList(itemIdsStr) {
  return itemIdsStr.split(",").map(Number);
}

function dedupItemsListById(items) {
  // Remove duplicates from "items". If 2 items have the same itemId, pick the first one
  const itemIds = items.map(item => item.itemId);
  const uniqueIds = [...new Set(itemIds)];
  return uniqueIds.map(id => items.find(item => item.itemId === id));
}

function getNextItemStatus(oldStatus) {
  switch (oldStatus) {
    case 'REQUESTED':
      return 'LISTED';
    case 'LISTED':
      return 'VERIFIED';
    case 'VERIFIED':
      return 'PAID';
    case 'PAID':
      return 'READY_FOR_PICKUP';
    case 'READY_FOR_PICKUP':
      return 'PICKED_UP';
    default:
      return oldStatus;
  }
}

async function setSingleItemNotificationFlag(itemId) {
  // Mark single item as needing a notification
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=1 where item_id = ?`,
      [itemId]
    );
    console.log("Set notification flag for item " + itemId);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/setSingleItemNotificationFlag");
    throw err;
  }
}

async function unsetItemsNotificationFlags(itemIds) {
  // Mark all items in item_ids as no longer needing notification (after sending batch email)
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=0 where item_id IN (?)`,
      [itemIds]
    );
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/unsetItemsNotificationFlags");
    throw err;
  }
}

export default {
  // data modeling
  sqlRowToItemObj,
  getItemObjFromItemId,
  getItemObjsFromItemIds,
  getAllItemObjs,

  // item status
  getNextItemStatus,
  getItemObjsWithStatus,
  updateSingleItemStatus,

  // in-current-transaction checks
  verifyItemsReadyForTransactionAndSetFlagsIfVerified,
  unsetInCurrentTransactionFlagForItemIds,
  getItemIdsWithStaleInCurrentTransactionTimestamp,

  // notification flags
  unsetItemsNotificationFlags,
  setSingleItemNotificationFlag,

  // utilities
  generatePickupCode,
  itemIdsListToString,
  itemIdsGroupConcatStringToNumberList,
  dedupItemsListById,
  getNextItemStatus,
}
