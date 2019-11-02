// Imports
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from "../util/errorHandler.js";

async function unsetStaleInCurrentTransactionFlags() {
  // unset in_current_transaction flags that have been set for more than 10 minutes
  try {
    const staleInCurrentTransactionItemIds = await itemHelpers.getItemIdsWithStaleInCurrentTransactionTimestamp();
    if (!staleInCurrentTransactionItemIds.length) {
      return;
    }
    await itemHelpers.unsetInCurrentTransactionFlagForItemIds(staleInCurrentTransactionItemIds);
    console.log(`unset in_current_transaction flags for itemIds: ${staleInCurrentTransactionItemIds}`);
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/unsetStaleInCurrentTransactionFlags");
    throw err;
  }
}

export default {
  unsetStaleInCurrentTransactionFlags
};
