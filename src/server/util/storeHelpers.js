// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';
import itemHelpers from '../util/itemHelpers.js';

function sqlRowToStoreObj(sqlRow) {
  return {
    storeId: sqlRow.store_id,
    storeName: sqlRow.name,
    storeEmail: sqlRow.email,
    storePhoneNumber: sqlRow.phone_number,
    storeMapsLink: sqlRow.google_maps,
    storePaymentMethod: sqlRow.payment_method,
    storeIban: sqlRow.iban,
    storePaypal: sqlRow.paypal
  };
}

async function getStoreObjFromStoreId(storeId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query("SELECT * from stores WHERE store_id=?", [storeId]);
    if (results.length === 0) {
      return null;
    }
    return sqlRowToStoreObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getStoreObjFromId");
    throw err;
  }
}

async function getStoreObjFromStoreEmail(storeEmail) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query("SELECT * from stores WHERE email=?", [storeEmail]);
    if (results.length === 0) {
      return null;
    }
    return sqlRowToStoreObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getStoreObjFromStoreId");
    throw err;
  }
}

async function getStoreObjFromStoreName(storeName) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query("SELECT * FROM stores WHERE name=?", [storeName]);
    if (results.length === 0) {
      return null;
    }
    return sqlRowToStoreObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getStoreObjFromStoreName");
    throw err;
  }
}

async function getItemObjsForStoreId(storeId) {
  // Get all items associated with this storeId
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM items_view WHERE store_id=?",
      [storeId]
    );
    return results.map(itemHelpers.sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getItemObjsForStoreId");
    throw err;
  }
}

async function getStoreObjsThatNeedNotification() {
  // Return a list of store objects that need notifying
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query("SELECT * from stores where needs_notification=1");
    return results.map(sqlRowToStoreObj);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getStoreObjsThatNeedNotification");
    throw err;
  }
}

async function getItemObjsForStoreNotificationEmail(storeId) {
  // Get items to notify the given store about
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM items_view WHERE store_id=? and in_notification=1",
      [storeId]
    );
    if (results.length === 0) {
      console.log("storeHelpers/getItemObjsForStoreNotificationEmail: No items included in notification");
      return [];
    }
    const updatedItemObjs = results.map(itemHelpers.sqlRowToItemObj);
    return updatedItemObjs;
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/getItemObjsForStoreNotificationEmail");
    throw err;
  }
}

async function setSingleStoreNotificationFlag(storeId) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=1 where store_id=?",
      [storeId]
    );
    console.log("Set store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/setSingleStoreNotificationFlag");
    throw err;
  }
}

async function unsetSingleStoreNotificationFlag(storeId) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=0 where store_id=?",
      [storeId]
    );
    console.log("Unset store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/unsetSingleStoreNotificationFlag");
    throw err;
  }
}

export default {
  sqlRowToStoreObj,
  getStoreObjFromStoreId,
  getStoreObjFromStoreEmail,
  getStoreObjFromStoreName,
  getItemObjsForStoreId,
  getStoreObjsThatNeedNotification,
  getItemObjsForStoreNotificationEmail,
  setSingleStoreNotificationFlag,
  unsetSingleStoreNotificationFlag
};
