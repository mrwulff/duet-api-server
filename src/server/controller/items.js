import fbHelpers from '../util/fbHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import sqlHelpers from "../util/sqlHelpers.js";

async function getItems(req, res) {
  // Get item info
  try {
    // Get list of items
    if (req.query.item_id && req.query.item_id.length) {
      let rows = await sqlHelpers.getItemRows(req.query.item_id);
      if (rows.length === 0) {
        return res.send([]);
      }
      let needs = rows.map(row => itemHelpers.sqlRowToItemObj(row));
      return res.json(needs);
    }
    // Get single item
    if (req.query.item_id) {
      let item = await sqlHelpers.getItemRow(req.query.item_id);
      if (!item) {
        return res.send([]);
      }
      return res.json([sqlRowToItemObj(item)]);
    }
    // Get items for store
    if (req.query.store_id) {
      let rows = await sqlHelpers.getItemsForStore(req.query.store_id);
      if (rows.length === 0) {
        return res.send([]);
      }
      let needs = [];
      rows.forEach(function (row) {
        needs.push(itemHelpers.sqlRowToItemObj(row));
      });
      return res.json(needs);
    }
    // Get all items
    let rows = await sqlHelpers.getAllItems();
    if (rows.length === 0) {
      return res.send([]);
    }
    let needs = rows.map(row => itemHelpers.sqlRowToItemObj(row));
    return res.json(needs);

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
          let newStatus = itemHelpers.getNextItemStatus(item.status);
          await sqlHelpers.updateItemStatus(newStatus, item.itemId);

          // Send generic item status updated email
          let itemResult = await sqlHelpers.getItemRow(item.itemId);
          if (itemResult) {
            sendgridHelpers.sendItemStatusUpdateEmail(itemResult);
          }

          // FB messenger pickup notification
          if (newStatus === 'READY_FOR_PICKUP') {
            fbHelpers.sendPickupNotification(item.itemId);
          }

          // Sendgrid pickup notification
          else if (newStatus === 'PICKED_UP') {
            const itemObj = await sqlHelpers.getItemObjFromItemId(item.itemId);
            const beneficiaryObj = await sqlHelpers.getBeneficiaryObjFromBeneficiaryId(itemObj.beneficiaryId);
            const donorObj = await sqlHelpers.getDonorObjFromDonorEmail(itemObj.donorEmail);
            const storeObj = await sqlHelpers.getStoreObjFromStoreId(itemObj.storeId);
            sendgridHelpers.sendItemPickedUpEmailV2(beneficiaryObj, donorObj, itemObj, storeObj);
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
