"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var conn = _config.default.dbInitConnect();

function getItems(req, res) {
  var query =
  "SELECT item_id, display_link, items.name, price_euros, paid, store_id, icon_url,stores.name as store_name FROM items " +
  "INNER JOIN categories USING(category_id) INNER JOIN stores USING(store_id)";
  var parameters = [];
  if (req.query.store_id) {
    query += " WHERE store_id=?";
    parameters.push(req.query.store_id);
  } else if (req.query.item_id) {
    query += " WHERE item_id=?";
    parameters.push(req.query.item_id);
  }
  conn.execute(query, parameters, function (err, rows) {
    if (err) {
      console.log(err);
      res.status(400).send();
    } else if (rows.length == 0) {
      res.send({
        msg: "No Item Needs" });

    } else {
      var item;
      var needs = [];
      rows.forEach(function (obj) {
        item = {
          itemId: obj.item_id,
          image: obj.display_link,
          name: obj.name,
          price: obj.price_euros,
          paid: obj.paid,
          storeId: obj.store_id,
          storeName: obj.store_name,
          icon: obj.icon_url };

        needs.push(item);
      });
      res.json(needs);
    }
  });
}

function verifyItems(req, res) {
  if (req.body.itemIds.length > 0) {
    var query = "UPDATE items SET is_verified=true WHERE 1=1 AND (";
    req.body.itemIds.forEach(function (id) {
      query += "item_id=" + id + " OR ";
    });
    query += "1=0);";
    conn.query(query, function (err, rows) {
      if (err) {
        console.log(err);
        res.status(400).send();
      } else {
        res.status(200).json({
          msg: "Items verified" });

      }
    });
  }
}var _default =

{ getItems: getItems, verifyItems: verifyItems };exports.default = _default;