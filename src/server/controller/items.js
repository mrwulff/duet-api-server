import fbHelpers from '../util/fbHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import storeHelpers from '../util/storeHelpers.js';
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";

async function getItems(req, res) {
  // Get item info
  try {
    // Get list of items
    if (req.query.item_id && req.query.item_id.length) {
      const itemObjs = itemHelpers.getItemObjsFromItemIds(req.query.item_id);
      return res.json(itemObjs);
    }
    // Get single item
    if (req.query.item_id) {
      const itemObj = await itemHelpers.getItemObjFromItemId(req.query.item_id);
      return res.json([itemObj]);
    }
    // Get items for store
    if (req.query.store_id) {
      const itemObjs = await storeHelpers.getItemObjsForStoreId(req.query.store_id);
      return res.json(itemObjs);
    }
    // Get all items
    const itemObjs = await itemHelpers.getAllItemObjs();
    return res.json(itemObjs);

  }
  catch (err) {
    errorHandler.handleError(err, "items/getItems");
    return res.status(500).send();
  }
}

async function updateItemStatus(req, res) {
  // Update status for list of items
  try {
    if (Array.isArray(req.body.items)) {
      if (req.body.items.length > 0) {
        console.log(`Updating item statuses for itemIds: ${req.body.items.map(item => item.itemId)}`);
        const itemsUnique = itemHelpers.dedupItemsListById(req.body.items);
        await Promise.all(itemsUnique.map(async item => {
          // Update item status in DB
          const newStatus = itemHelpers.getNextItemStatus(item.status);
          await itemHelpers.updateSingleItemStatus(newStatus, item.itemId);

          // Send generic item status updated email
          const itemObj = await itemHelpers.getItemObjFromItemId(item.itemId);
          if (itemObj) {
            sendgridHelpers.sendItemStatusUpdateEmail(itemObj);
          }

          // FB messenger pickup notification
          if (newStatus === 'READY_FOR_PICKUP') {
            fbHelpers.sendPickupNotification(item.itemId);
          }

          // Sendgrid pickup notification
          else if (newStatus === 'PICKED_UP') {
            sendgridHelpers.sendItemPickedUpEmailV2(item.itemId);
          }
        }));
      }
      res.status(200).send();
    } else {
      res.status(400).json({
        error: 'invalid request body'
      });
    }
  } catch (err) {
    errorHandler.handleError(err, "items/updateItemStatus");
    res.status(500).send();
  }
}

export default {
  getItems,
  updateItemStatus,
};
