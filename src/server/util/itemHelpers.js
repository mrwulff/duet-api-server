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

function rowToItemObj(row) {
  // SQL row to item object
  let itemObj = {
    itemId: row.item_id,
    image: row.link,
    name: row.name,
    size: row.size,
    price: row.price_euros,
    storeId: row.store_id,
    storeName: row.store_name,
    storeMapsLink: row.store_maps_link,
    icon: row.icon_url,
    status: row.status,
    pickupCode: row.pickup_code,
    donationTimestamp: row.donation_timestamp
  }
  return itemObj;
}

function getNextItemStatus(oldStatus) {
  // Move to next item status
  let newStatus = oldStatus;
  switch (oldStatus) {
    case 'LISTED':
      newStatus = 'VERIFIED';
      break;
    case 'VERIFIED':
      newStatus = 'PAID';
      break;
    case 'PAID':
      newStatus = 'READY_FOR_PICKUP';
      break;
    case 'READY_FOR_PICKUP':
      newStatus = 'PICKED_UP';
      break;
  }
  return newStatus;
}

export default {
  generatePickupCode,
  rowToItemObj,
  getNextItemStatus
}