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
      let rows = await sqlHelpers.getItems(req.query.item_id);
      if (rows.length === 0) {
        return res.send([]);
      }
      let needs = rows.map(row => itemHelpers.getFrontEndItemObj(row));
      return res.json(needs);
    }
    // Get single item
    if (req.query.item_id) {
      let item = await sqlHelpers.getItem(req.query.item_id);
      if (!item) {
        return res.send([]);
      }
      return res.json([getFrontEndItemObj(item)]);
    }
    // Get items for store
    if (req.query.store_id) {
      let rows = await sqlHelpers.getItemsForStore(req.query.store_id);
      if (rows.length === 0) {
        return res.send([]);
      }
      let needs = [];
      rows.forEach(function (row) {
        needs.push(itemHelpers.getFrontEndItemObj(row));
      });
      return res.json(needs);
    }
    // Get all items
    let rows = await sqlHelpers.getAllItems();
    if (rows.length === 0) {
      return res.send([]);
    }
    let needs = rows.map(row => itemHelpers.getFrontEndItemObj(row));
    return res.json(needs);

  }
  catch (err) {
    errorHandler.handleError(err, "items/getItems");
    return res.status(500).send();
  }
}

async function updateItemStatus(req, res) {
  // Update status for list of items
  // Important: make sure all items are being updated to the same status!
  try {
    if (Array.isArray(req.body.items)) {
      if (req.body.items.length > 0) {
        console.log(`Updating item statuses for itemIds: ${req.body.items.map(item => item.itemId)}`);
        const itemsUnique = itemHelpers.dedupItemsListById(req.body.items);
        itemsUnique.forEach(async item => {
          // Update item status in DB
          let newStatus = itemHelpers.getNextItemStatus(item.status);
          await sqlHelpers.updateItemStatus(newStatus, item.itemId);

          // Send generic item status updated email
          let itemResult = await sqlHelpers.getItem(item.itemId);
          if (itemResult) {
            sendgridHelpers.sendItemStatusUpdateEmail(itemResult);
          }

          // FB messenger pickup notification
          if (newStatus === 'READY_FOR_PICKUP') {
            fbHelpers.sendPickupNotification(item.itemId);
          }

          // Sendgrid pickup notification
          else if (newStatus === 'PICKED_UP') {
            let itemResult = await sqlHelpers.getItem(item.itemId);
            if (itemResult) {
              sendgridHelpers.sendItemPickedUpEmail(itemResult);
            }
          }
        });
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

// NOTE: DEPRECATED. Use updateItemStatus route
// function verifyItems(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='VERIFIED' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, (err, rows) => {
//       if (err) {
//         console.log(err);
//         res.status(400).send();
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to VERIFIED"
//         });
//       }
//     });
//   }
// }

// NOTE: DEPRECATED. Use updateItemStatus route
// function readyForPickup(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='READY_FOR_PICKUP' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, err => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({
//           err: err
//         });
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to READY_FOR_PICKUP"
//         });
//       }
//     });
//   }
// }

// NOTE: DEPRECATED. Use updateItemStatus route
// function pickupConfirmation(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='PICKED_UP' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, err => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({
//           err: err
//         });
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to PICKED_UP"
//         });
//       }
//     });
//   }
// }

export default {
  getItems,
  updateItemStatus,
  // verifyItems,
  // readyForPickup,
  // pickupConfirmation,
};
