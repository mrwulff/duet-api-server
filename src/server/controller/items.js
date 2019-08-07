import fbHelpers from '../util/fbHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import sendgridHelpers from "../util/sendgridHelpers.js";
import errorHandler from "../util/errorHandler.js";
import sqlHelpers from "../util/sqlHelpers.js";

async function getItems(req, res) {
  // Get item info
  try {
    // Get single item
    if (req.query.item_id) {
      let item = await sqlHelpers.getItem(req.query.item_id);
      res.json([item]);
    }
    // Get items for store
    else if (req.query.store_id) {
      let rows = await sqlHelpers.getItemsForStore(req.query.store_id);
      if (rows.length === 0) {
        res.send({ msg: "No Item Needs" });
      }
      let needs = [];
      rows.forEach(function (row) {
        needs.push(itemHelpers.getFrontEndItemObj(row));
      });
      res.json(needs);
    }
    // Get all items
    else {
      let rows = await sqlHelpers.getAllItems();
      if (rows.length === 0) {
        res.send({ msg: "No Item Needs" });
      }
      let needs = [];
      rows.forEach(function (row) {
        needs.push(itemHelpers.getFrontEndItemObj(row));
      });
      res.json(needs);
    }
  }
  catch (err) {
    errorHandler.handleError(err, "items/getItems");
    res.status(500).send();
  }
}

async function updateItemStatus(req, res) {
  // Update status for list of items
  // Important: make sure all items are being updated to the same status!
  try {
    if (Array.isArray(req.body.items)) {
      if (req.body.items.length > 0) {
        req.body.items.forEach(async item => {
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
