import sqlHelpers from '../util/sqlHelpers.js';
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

async function sendBankTransfersToStores() {
  // 1. check for stores needing payment
  // 2. send payment
  // 3. mark items as "bank transfer sent"
  // 4. send email to store
  // 5. send Transferwise balance email to duet.giving@gmail.com
  try {
    // get all stores needing payment via bank transfer
    const storesNeedingTransfer = await sqlHelpers.getStoresNeedingBankTransfer();
    await Promise.all(storesNeedingTransfer.map(async result => {
      // send payment
      const transferId = await transferwiseHelpers.sendBankTransfer(result.store_name, result.iban, result.payment_amount, "EUR");
      // set "bank_transfer_sent" flag to avoid duplicate payments
      await sqlHelpers.setBankTransferSentFlag(result.item_ids);
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
    errorHandler.handleError(err, "storeHelpers/sendBankTransfersToStores");
  }
}

async function sendNotificationEmailsToStores() {
  try {
    // Get stores that need notifying
    const results = await sqlHelpers.getStoresThatNeedNotification();

    if (results.length < 1) {
      // no stores need notification
      console.log('No stores need notification currently');
      return;
    }

    // Loop through each of the stores that require a notification
    await Promise.all(results.map(async result => {
      // Get items for store
      const updatedItems = await sqlHelpers.getItemsForNotificationEmail(result.store_id);
      if (updatedItems.length === 0) {
        console.log('No new updates to items');
        return;
      }
      // Send email
      await sendgridHelpers.sendStoreNotificationEmail({
        name: result.name,
        email: result.email,
        updatedItems: updatedItems
      });

      // Reset items' notification flags
      await sqlHelpers.unsetItemsNotificationFlag(updatedItems.map(item => item.itemId));
      await sqlHelpers.unsetSingleStoreNotificationFlag(result.store_id);
    }));
  } catch (err) {
    errorHandler.handleError(err, "storeHelpers/sendStoreownerNotificationEmail");
    throw err;
  }
}

export default {
  sqlRowToStoreObj,
  sendBankTransfersToStores,
  sendNotificationEmailsToStores
};
