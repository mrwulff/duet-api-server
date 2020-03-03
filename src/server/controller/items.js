// imports
import fbHelpers from '../util/fbHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import storeHelpers from '../util/storeHelpers.js';
import sendgridHelpers from "../util/sendgridHelpers.js";
import matchingHelpers from "../util/matchingHelpers.js";
import errorHandler from "../util/errorHandler.js";

async function getItems(req, res) {
  // Get item info
  try {
    // Get single item: e.g. /api/items/123
    if (req.params && req.params.itemId) {
      console.log(`getItems: Getting single item with itemId: ${req.params.itemId}`);
      const itemObj = await itemHelpers.getItemObjFromItemId(req.params.itemId);
      if (!itemObj) {
        return res.sendStatus(404);
      }
      return res.json(itemObj);
    }
    // Get list of items: e.g. /api/items?item_id=123&item_id=124
    if (req.query.item_id && req.query.item_id.length) {
      console.log(`getItems: Getting items with itemIds: ${req.query.item_id}`);
      const itemObjs = await itemHelpers.getItemObjsFromItemIds(req.query.item_id);
      return res.json(itemObjs);
    }
    // Get single item (in a list): e.g. /api/items?item_id=123
    if (req.query.item_id) {
      console.log(`getItems: Getting item with itemId: ${req.query.item_id}`);
      const itemObj = await itemHelpers.getItemObjFromItemId(req.query.item_id);
      return res.json([itemObj]);
    }
    // Get items for store: e.g. /api/items?store_id=15
    if (req.query.store_id) {
      console.log(`getItems: Getting item for storeId: ${req.query.store_id}`);
      const itemObjs = await storeHelpers.getItemObjsForStoreId(req.query.store_id);
      return res.json(itemObjs);
    }
    // Get all items: e.g. /api/items
    console.log(`getItems: Getting all items`);
    const itemObjs = await itemHelpers.getAllItemObjs();
    return res.json(itemObjs);
  }
  catch (err) {
    errorHandler.handleError(err, "items/getItems");
    return res.status(500).send();
  }
}

async function itemSearch(req, res) {
  // Search for item by query: e.g. api/items/search?itemInstanceTag=womens
  try {
    // get search params
    if (!req.query) {
      console.log(`itemSearch received no query params!`);
      return res.status(400).json({ msg: "No search parameters given!" });
    }
    const { status, itemInstanceTag, itemTypeTag } = req.query;
    const fairness = req.query.fairness === 'true' ? true : false;
    if (!status && !itemInstanceTag && !itemTypeTag) {
      console.log(`itemSearch received no query params!`);
      return res.status(400).json({ msg: "No search parameters given!" });
    }
    // filter by status
    let items;
    if (status) {
      console.log(`itemSearch: filtering by status = ${status}`);
      items = await itemHelpers.getItemObjsWithStatus(status);
    } else {
      items = await itemHelpers.getAllItemObjs();
    }
    // filter by beneficiaryIsVisible
    items = items.filter(item => item.beneficiaryIsVisible);
    // filter by itemInstanceTag
    if (itemInstanceTag) {
      console.log(`itemSearch: filtering by itemInstanceTag = ${itemInstanceTag}`);
      items = items.filter(item => item.itemInstanceTags.includes(itemInstanceTag));
    }
    // filter by itemTypeTag
    if (itemTypeTag) {
      console.log(`itemSearch: filtering by itemTypeTag = ${itemTypeTag}`);
      items = items.filter(item => item.itemTypeTags.includes(itemTypeTag));
    }
    // select a single item to return
    if (!items.length) {
      return res.status(400).json({ msg: "No items match search query!" });
    }
    let selectedItem;
    if (items.length === 1) {
      console.log(`itemSearch: returning only item remaining after filtering...`);
      selectedItem = items[0];
    }
    else if (fairness) {
      console.log(`itemSearch: selecting an item using matching algorithm from ${items.length} filtered items...`);
      selectedItem = await matchingHelpers.sampleItemWithFairness(items);
    } else {
      console.log(`itemSearch: selecting an item at random from ${items.length} filtered items...`);
      selectedItem = matchingHelpers.sampleFromListAtRandom(items);
    }
    return res.status(200).json(selectedItem);
  } catch (err) {
    errorHandler.handleError(err, "items/itemSearch");
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
          // If item status is already up to date in the DB, then return
          const newStatus = itemHelpers.getNextItemStatus(item.status);
          const itemFromDB = await itemHelpers.getItemObjFromItemId(item.itemId);
          if (newStatus === itemFromDB.status) {
            console.log(`updateItemStatus: item ${item.itemId} status (${newStatus}) already up to date`);
            return;
          }

          // Update item status in DB
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

async function updateItemDonorMessage(req, res) {
  // update the "donorMessage" column for item(s):
  try {
    if (Array.isArray(req.body.itemIds) && req.body.message) {
      if (req.body.itemIds.length > 0) {
        console.log(`Adding donor messages for itemIds: ${req.body.itemIds}`);

        await Promise.all(req.body.itemIds.map(async itemId => {
          // update donor message in DB:
          await itemHelpers.updateDonorMessage(itemId, req.body.message);
        }));

        res.status(200).send();
      }
    } else {
      res.status(400).json({
        error: 'invalid request body'
      });
    }
  } catch (err) {
    errorHandler.handleError(err, "items/updateItemDonorMessage");
    res.status(500).send();
  }

}

export default {
  getItems,
  itemSearch,
  updateItemStatus,
  updateItemDonorMessage,
};
