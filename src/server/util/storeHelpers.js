// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import transferwiseHelpers from '../util/transferwiseHelpers.js';
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

async function sendBankTransfersAndEmailsToStores() {
  // 1. check for stores needing payment
  // 2. send payment
  // 3. mark items as "bank transfer sent"
  // 4. send email to store
  // 5. send Transferwise balance email to duet.giving@gmail.com
  try {
    // get all stores needing payment via bank transfer
    const storesNeedingTransfer = await transferwiseHelpers.getStoresNeedingBankTransfer();
    await Promise.all(storesNeedingTransfer.map(async result => {
      // send payment
      const transferId = await transferwiseHelpers.sendBankTransfer(result.store_name, result.iban, result.payment_amount, "EUR");
      // set "bank_transfer_sent" flag to avoid duplicate payments
      await transferwiseHelpers.setBankTransferSentFlagForItemIds(result.item_ids);
      // send email to store
      const itemIdsStr = itemHelpers.itemIdsListToString(result.item_ids);
      await sendgridHelpers.sendStorePaymentEmail({
        storeEmail: result.store_email,
        storeName: result.store_name,
        paymentAmountEuros: result.payment_amount,
        itemIds: itemIdsStr,
        paymentMethod: "bank"
      });
      console.log(`${result.store_name} bank transfer item_ids: ${itemIdsStr}`);
    }));
    // if payment was sent, send balance update email to duet.giving@gmail.com
    if (storesNeedingTransfer.length) {
      await transferwiseHelpers.sendTransferwiseEuroBalanceUpdateEmail();
    }
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/sendBankTransfersAndEmailsToStores");
  }
}

async function sendItemVerificationEmailsToStores() {
  try {
    // Get stores that need notifying
    const storeObjs = await getStoreObjsThatNeedNotification();

    if (storeObjs.length < 1) {
      // no stores need notification
      console.log('No stores need notification currently');
      return;
    }

    // Loop through each of the stores that require a notification
    await Promise.all(storeObjs.map(async storeObj => {
      // Get items for store
      const updatedItemObjs = await getItemObjsForStoreNotificationEmail(storeObj.storeId);
      if (updatedItemObjs.length === 0) {
        console.log('No new updates to items');
        return;
      }
      // Send email
      await sendgridHelpers.sendStoreItemVerificationEmail(storeObj, updatedItemObjs);

      // Reset items' notification flags
      await itemHelpers.unsetItemsNotificationFlags(updatedItemObjs.map(item => item.itemId));
      await unsetSingleStoreNotificationFlag(storeObj.storeId);
    }));
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/sendItemVerificationEmailsToStores");
    throw err;
  }
}

export default {
  sqlRowToStoreObj,
  getStoreObjFromStoreId,
  getStoreObjFromStoreEmail,
  getStoreObjFromStoreName,
  getItemObjsForStoreId,
  setSingleStoreNotificationFlag,
  sendBankTransfersAndEmailsToStores,
  sendItemVerificationEmailsToStores
};
