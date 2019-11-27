// Imports
import storeHelpers from '../util/storeHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import transferwiseHelpers from '../util/transferwiseHelpers.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from "../util/errorHandler.js";

async function listRequestedItemsAndSetNotificiationFlags() {
  // move items from REQUESTED --> LISTED; set item & store notification flags
  // prep for sendItemVerificationEmailsToStores()
  try {
    const requestedItemObjs = await itemHelpers.getItemObjsWithStatus('REQUESTED');
    await Promise.all(requestedItemObjs.map(async item => {
      await itemHelpers.setSingleItemNotificationFlag(item.itemId);
      await storeHelpers.setSingleStoreNotificationFlag(item.storeId);
      await itemHelpers.updateSingleItemStatus('LISTED', item.itemId);
      console.log("Successfully listed and set notification flags for item " + item.itemId);
    }));
  } catch (err) {
    errorHandler.handleError(err, "storesCronFunctions/listRequestedItemsAndSetNotificiationFlags");
    throw err;
  }
}

async function sendItemVerificationEmailsToStores() {
  // Send each store item verification emails for newly LISTED items
  try {
    // Get stores that need notifying
    const storeObjs = await storeHelpers.getStoreObjsThatNeedNotification();
    if (storeObjs.length < 1) {
      // no stores need notification
      console.log('No stores need notification currently');
      return;
    }
    // Loop through each of the stores that require a notification
    await Promise.all(storeObjs.map(async storeObj => {
      // Get items for store
      const updatedItemObjs = await storeHelpers.getItemObjsForStoreNotificationEmail(storeObj.storeId);
      if (updatedItemObjs.length === 0) {
        console.log('No new updates to items');
        return;
      }
      // Send email
      await sendgridHelpers.sendStoreItemVerificationEmail(storeObj, updatedItemObjs);
      // Reset items' notification flags
      await itemHelpers.unsetItemsNotificationFlags(updatedItemObjs.map(item => item.itemId));
      await storeHelpers.unsetSingleStoreNotificationFlag(storeObj.storeId);
    }));
  } catch (err) {
    errorHandler.handleError(err, "storesCronFunctions/sendItemVerificationEmailsToStores");
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
    if (!storesNeedingTransfer.length) {
      console.log("No stores need bank transfer");
      return;
    }
    await Promise.all(storesNeedingTransfer.map(async result => {
      // send payment
      const transferId = await transferwiseHelpers.sendBankTransfer(result.store_name, result.iban, result.payment_amount, "EUR");
      // set "bank_transfer_sent" flag to avoid duplicate payments
      await transferwiseHelpers.setBankTransferSentFlagForItemIds(result.item_ids);
      await itemHelpers.setStorePaymentInitiatedTimestampForItemIds(result.item_ids);
      // set transferwise_transfer_id for later tracking
      await transferwiseHelpers.setTransferwiseTransferIdForItemIds(transferId, result.item_ids);
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
    await transferwiseHelpers.sendTransferwiseEuroBalanceUpdateEmail();
  } catch (err) {
    errorHandler.handleError(err, "storesCronFunctions/sendBankTransfersAndEmailsToStores");
  }
}

export default {
  listRequestedItemsAndSetNotificiationFlags,
  sendItemVerificationEmailsToStores,
  sendBankTransfersAndEmailsToStores
};
