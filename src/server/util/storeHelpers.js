import sqlHelpers from '../util/sqlHelpers.js';
import errorHandler from '../util/errorHandler.js';
import sendgridHelpers from '../util/sendgridHelpers.js';

async function sendNotificationEmailsToStores() {
  try {
    // Get stores that need notifying
    let results = await sqlHelpers.getStoresThatNeedNotification();

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

      // Get recipient list
      let recipientList = [];
      if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
        recipientList = ['duet.giving@gmail.com'];
      } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
        recipientList = ['duet.giving@gmail.com', result.email];
      }

      // Send email
      await sendgridHelpers.sendStoreNotificationEmail({
        recipientList: recipientList,
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
  sendNotificationEmailsToStores
}