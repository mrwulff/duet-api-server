import db from "./../config/config.js";

const conn = db.dbInitConnect();

function getItems(req, res) {
  let query =
    "SELECT item_id, display_link, items.name, price_euros, is_fulfilled, store_id, icon_url,stores.name as store_name FROM items " +
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
          fulfilled: obj.is_fulfilled,
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

export default { getItems };
