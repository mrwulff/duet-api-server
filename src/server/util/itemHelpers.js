import sqlHelpers from '../util/sqlHelpers.js';
import errorHandler from '../util/errorHandler.js';

function sqlRowToItemObj(row) {
  // SQL row to item object
  let itemObj = {
    itemId: row.item_id,
    image: row.item_photo_link,
    name: row.item_name,
    size: row.size,
    price: row.price_euros,
    comment: row.comment,
    storeId: row.store_id,
    storeName: row.store_name,
    storeMapsLink: row.store_maps_link,
    icon: row.icon_url,
    status: row.status,
    pickupCode: row.pickup_code,
    requestedTimestamp: row.requested_timestamp,
    beneficiaryId: row.beneficiary_id,
    donorFirst: row.donor_first,
    donorLast: row.donor_last,
    donorEmail: row.donor_email,
    donorCountry: row.donor_country,
    donationTimestamp: row.donation_timestamp,
  }
  return itemObj;
}

function generatePickupCode(itemId) {
  let code = "DUET-";
  let pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // append 2 random letters to code
  for (let i = 0; i < 2; i++) {
    code += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  // append item id
  code += itemId;
  return code;
}

function itemIdsListToString(itemIdsList) {
  var itemIdsStr = itemIdsList.map(id => `#${id}`); // e.g. ["#63", "#43"]
  itemIdsStr = itemIdsStr.join(", "); // e.g. "#79, #75, #10"
  return itemIdsStr;
}

function dedupItemsListById(items) {
  // Remove duplicates from "items". If 2 items have the same itemId, pick the first one
  const itemIds = items.map(item => item.itemId);
  let uniqueIds = [...new Set(itemIds)];
  return uniqueIds.map(id => items.find(item => item.itemId === id));
}

function getNextItemStatus(oldStatus) {
  switch (oldStatus) {
    case 'REQUESTED':
      return 'LISTED';
    case 'LISTED':
      return 'VERIFIED';
    case 'VERIFIED':
      return 'PAID';
    case 'PAID':
      return 'READY_FOR_PICKUP';
    case 'READY_FOR_PICKUP':
      return 'PICKED_UP';
    default:
      return oldStatus;
  }
}

async function listRequestedItemsAndSetNotificiationFlags() {
  try {
    let requestedItems = await sqlHelpers.getItemsWithStatus('REQUESTED');
    await Promise.all(requestedItems.map(async item => {
      await sqlHelpers.setItemNotificationFlag(item.item_id);
      await sqlHelpers.setSingleStoreNotificationFlag(item.store_id);
      await sqlHelpers.updateItemStatus('LISTED', item.item_id);
      console.log("Successfully listed and set notification flags for item " + item.item_id);
    }));
  } catch (err) {
    errorHandler.handleError(err, "itemHelpers/listRequestedItems");
    throw err;
  }
}

export default {
  generatePickupCode,
  itemIdsListToString,
  sqlRowToItemObj,
  dedupItemsListById,
  getNextItemStatus,
  listRequestedItemsAndSetNotificiationFlags
}