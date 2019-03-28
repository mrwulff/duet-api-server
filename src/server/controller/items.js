import db from "./../config/config.js";

const conn = db.dbInitConnect();

function getItems(req, res) {
  let query =
    "SELECT item_id, display_link, items.name, price_euros, paid, store_id, icon_url,stores.name as store_name FROM items " +
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
          paid: obj.paid,
          storeId: obj.store_id,
          storeName: obj.store_name,
          icon: obj.icon_url
        };
        needs.push(item);
      });
      res.json(needs);
    }
  });
}

function verifyItems(req, res) {
  if (req.body.itemIds.length > 0) {
    let query = "UPDATE items SET is_verified=true WHERE 1=1 AND (";
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
          msg: "Items verified"
        });
      }
    });
  }
}

export default { getItems, verifyItems };
