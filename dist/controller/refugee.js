"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var conn = _config.default.dbInitConnect();

function generatePickupCode(itemId) {
  var code = "DUET-";
  var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // append 2 random letters to code
  for (var i = 0; i < 2; i++) {
    code += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  // append item id
  code += itemId;
  return code;
}

function processTypeform(req, res) {
  console.log("processing typeform");
  var answers = req.body.form_response.answers;
  if (answers.length > 0) {
    var id = answers[0].text;
    var itemName = answers[1].text;
    var url = answers[2].file_url;
    var category = answers[3].choice.label;
    var price = answers[4].text;
    var size = null;
    var store;
    if (answers.length == 8) {
      size = answers[5].text;
      store = answers[6].choice.label;
    } else {
      console.log(answers[5].choice);
      store = answers[5].choice.label;
    }
    // get category id of item
    conn.query(
    "SELECT category_id FROM categories WHERE name=?",
    [category],
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send();
      } else if (rows.length == 0) {
        res.status(400).json({
          err: "Invalid Category Name" });

      } else {
        var category_id = rows[0].category_id;
        // get store id
        store = store.substr(0, store.indexOf("(")).trim();
        conn.query(
        "SELECT store_id FROM stores WHERE name=?",
        [store],
        function (err, rows) {
          if (err) {
            console.log(err);
            res.status(500).send();
          } else if (rows.length == 0) {
            res.status(400).json({
              err: "Invalid Store Name" });

          } else {
            var store_id = rows[0].store_id;
            // insert item
            conn.query(
            "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link) VALUES (?,?,?,?,?,?,?)",
            [itemName, size, price, id, category_id, store_id, url],
            function (err) {
              if (err) {
                console.log(err);
                res.status(500).send();
              } else {
                // get item of id of inserted entry
                conn.execute("SELECT LAST_INSERT_ID()", function (
                err,
                rows)
                {
                  if (err && rows.length < 1) {
                    console.log(err);
                    res.status(500).send({ error: err });
                  } else {
                    var itemId = rows[0]["LAST_INSERT_ID()"];
                    // get code for item
                    var code = generatePickupCode(itemId);
                    // update item pick up code
                    conn.execute(
                    "UPDATE items SET pickup_code=? WHERE item_id=?",
                    [code, itemId],
                    function (err) {
                      if (err) {
                        console.log(err);
                        res.status(500).send({ error: err });
                      } else {
                        res.status(200).send();
                      }
                    });

                  }
                });
              }
            });


            // set notification status for store_id to be true...
            conn.query(
            "UPDATE stores SET needs_notification=true where store_id=?",
            [store_id],
            function (err) {
              if (err) {
                console.log(err);
                res.status(500).send();
              } else {
                res.status(200).send();
              }
            });

          }
        });

      }
    });

  }
}

function getNeeds(req, res) {
  var query =
  "SELECT beneficiary_id, CONCAT(beneficiaries.first_name, ' ', beneficiaries.last_name) as 'beneficiary_name', story, " +
  "origin_city, origin_country, current_city, current_country, family_image_url";
  if (req.query.beneficiary_id) {
    var beneficiaryId = req.query.beneficiary_id;
    conn.execute(
    query + " FROM beneficiaries WHERE beneficiary_id = ?",
    [beneficiaryId],
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send();
      } else if (rows.length == 0) {
        res.status(400).json({
          err: "Invalid Beneficiary ID" });

      } else {
        var beneficiaryObj = {
          beneficiaryId: beneficiaryId,
          name: rows[0].beneficiary_name,
          story: rows[0].story,
          originCity: rows[0].origin_city,
          originCountry: rows[0].origin_country,
          currentCity: rows[0].current_city,
          currentCountry: rows[0].current_country,
          familyImage: rows[0].family_image_url };

        conn.execute(
        "SELECT item_id, link, items.name, price_euros, status, store_id, icon_url,stores.name as store_name FROM items " +
        "INNER JOIN categories USING(category_id) INNER JOIN stores USING(store_id) WHERE beneficiary_id = ?",
        [beneficiaryId],
        function (err, rows) {
          if (err) {
            console.log(err);
            res.status(400).send();
          } else if (rows.length == 0) {
            res.send({
              msg: "Beneficiary Has No Item Needs" });

          } else {
            var item;
            var needs = [];
            rows.forEach(function (obj) {
              item = {
                itemId: obj.item_id,
                image: obj.link,
                name: obj.name,
                price: obj.price_euros,
                storeId: obj.store_id,
                storeName: obj.store_name,
                icon: obj.icon_url,
                status: obj.status };

              needs.push(item);
            });
            beneficiaryObj["needs"] = needs;
            res.json(beneficiaryObj);
          }
        });

      }
    });

  } else {
    var result = [];
    conn.execute(
    query +
    ", item_id, link, items.name, price_euros, status, store_id, icon_url, stores.name AS store_name " +
    "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " +
    "INNER JOIN stores USING(store_id) ORDER BY beneficiary_id",
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send();
      } else if (rows.length == 0) {
        res.json({
          msg: "No Item Needs" });

      } else {
        var current = -1;
        var beneficiaryObj;
        var _result = [];
        rows.forEach(function (obj) {
          if (current != obj.beneficiary_id) {
            if (beneficiaryObj) {
              _result.push(beneficiaryObj);
            }
            beneficiaryObj = {
              beneficiaryId: obj.beneficiary_id,
              name: obj.beneficiary_name,
              story: obj.story,
              originCity: obj.origin_city,
              originCountry: obj.origin_country,
              currentCity: obj.current_city,
              currentCountry: obj.current_country,
              familyImage: obj.family_image_url,
              needs: [
              {
                itemId: obj.item_id,
                image: obj.link,
                name: obj.name,
                price: obj.price_euros,
                storeId: obj.store_id,
                storeName: obj.store_name,
                icon: obj.icon_url,
                status: obj.status }] };



          } else {
            beneficiaryObj["needs"].push({
              itemId: obj.item_id,
              image: obj.link,
              name: obj.name,
              price: obj.price_euros,
              storeId: obj.store_id,
              storeName: obj.store_name,
              icon: obj.icon_url,
              status: obj.status });

          }
          current = obj.beneficiary_id;
        });
        _result.push(beneficiaryObj);
        res.json(_result);
      }
    });

  }
}var _default =

{ processTypeform: processTypeform, getNeeds: getNeeds };exports.default = _default;