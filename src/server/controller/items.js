import db from "./../config/config.js";

const conn = db.dbInitConnect();

function getItems(req, res) {
  let query =
    "SELECT item_id, display_link, items.name, price_euros, store_id, icon_url,stores.name as store_name, items.status FROM items " +
    "INNER JOIN categories USING(category_id) INNER JOIN stores USING(store_id)";
  let parameters = [];
  if (req.query.store_id) {
    query += " WHERE store_id=?";
    parameters.push(req.query.store_id);
  } else if (req.query.item_id) {
    query += " WHERE item_id=?";
    parameters.push(req.query.item_id);
  }
  conn.execute(query, parameters, function(err, rows) {
    if (err) {
      console.log(err);
      res.status(400).send();
    } else if (rows.length == 0) {
      res.send({
        msg: "No Item Needs"
      });
    } else {
      let item;
      let needs = [];
      rows.forEach(function(obj) {
        item = {
          itemId: obj.item_id,
          image: obj.display_link,
          name: obj.name,
          price: obj.price_euros,
          storeId: obj.store_id,
          storeName: obj.store_name,
          icon: obj.icon_url,
          status: obj.status
        };
        needs.push(item);
      });
      res.json(needs);
    }
  });
}

function updateItemStatus(req, res) {
  const safeWords = ['LISTED', 'VERIFIED', 'PAID', 'READY_FOR_PICKUP', 'PICKED_UP'];
  
  if (req.body.newStatus && req.body.itemIds && Array.isArray(req.body.itemIds)) {
    if (safeWords.includes(req.body.newStatus)) {
      if (req.body.itemIds.length > 0) {
        let query = `UPDATE items SET status='${req.body.newStatus}' WHERE 1=1 AND (`;
        req.body.itemIds.forEach(id => {
          query += `item_id=${id} OR `;
        });
        query += `1=0);`;
        conn.query(query, (err, rows) => {
          if (err) {
            console.log(err);
            res.status(400).send();
          } else {
            res.status(200).json({
              msg: `Item status updated to ${req.body.newStatus}`,
            });
          }
        });
      }
    } else {
      res.status(400).json({
        error: 'Invalid status type'
      })
    }
  } else {
    res.status(400).json({
      error: 'invalid request body'
    });
  }
}

function verifyItems(req, res) {
  if (req.body.itemIds.length > 0) {
    let query = "UPDATE items SET status='VERIFIED' WHERE 1=1 AND (";
    req.body.itemIds.forEach(id => {
      query += "item_id=" + id + " OR ";
    });
    query += "1=0);";
    conn.query(query, (err, rows) => {
      if (err) {
        console.log(err);
        res.status(400).send();
      } else {
        res.status(200).json({
          msg: "Item status updated to VERIFIED"
        });
      }
    });
  }
}

function readyForPickup(req, res) {
  if (req.body.itemIds.length > 0) {
    let query = "UPDATE items SET status='READY_FOR_PICKUP' WHERE 1=1 AND (";
    req.body.itemIds.forEach(id => {
      query += "item_id=" + id + " OR ";
    });
    query += "1=0);";
    conn.query(query, err => {
      if (err) {
        console.log(err);
        res.status(500).json({
          err: err
        });
      } else {
        res.status(200).json({
          msg: "Item status updated to READY_FOR_PICKUP"
        });
      }
    });
  }
}

function pickupConfirmation(req, res) {
  if (req.body.itemIds.length > 0) {
    let query = "UPDATE items SET status='PICKED_UP' WHERE 1=1 AND (";
    req.body.itemIds.forEach(id => {
      query += "item_id=" + id + " OR ";
    });
    query += "1=0);";
    conn.query(query, err => {
      if (err) {
        console.log(err);
        res.status(500).json({
          err: err
        });
      } else {
        res.status(200).json({
          msg: "Item status updated to PICKED_UP"
        });
      }
    });
  }
}

export default { getItems, verifyItems, readyForPickup, pickupConfirmation, updateItemStatus };
