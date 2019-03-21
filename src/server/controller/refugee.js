import db from "./../config/config.js";

const conn = db.dbInitConnect();

function processTypeform(req, res) {
  let body = JSON.parse(req.body);
  console.log(body);
  res.status(200).send();
}

function getNeeds(req, res) {
  let query =
    "SELECT beneficiary_id, CONCAT(beneficiaries.first_name, ' ', beneficiaries.last_name) as 'beneficiary_name', story, " +
    "origin_city, origin_country, current_city, current_country, family_image_url";
  if (req.query.beneficiary_id) {
    let beneficiaryId = req.query.beneficiary_id;
    conn.execute(
      query + " FROM beneficiaries WHERE beneficiary_id = ?",
      [beneficiaryId],
      function(err, rows) {
        if (err) {
          console.log(err);
          res.status(400).send();
        }
        let beneficiaryObj = {
          beneficiaryId: beneficiaryId,
          name: rows[0].beneficiary_name,
          story: rows[0].story,
          originCity: rows[0].origin_city,
          originCountry: rows[0].origin_country,
          currentCity: rows[0].current_city,
          currentCountry: rows[0].current_country,
          familyImage: rows[0].family_image_url
        };
        conn.execute(
          "SELECT item_id, display_link, items.name, price_euros, is_fulfilled, store_id, icon_url,stores.name as store_name FROM items " +
            "INNER JOIN categories USING(category_id) INNER JOIN stores USING(store_id) WHERE beneficiary_id = ?",
          [beneficiaryId],
          function(err, rows) {
            if (err) {
              console.log(err);
              res.status(400).send();
            }
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
            beneficiaryObj["needs"] = needs;
            res.json(beneficiaryObj);
          }
        );
      }
    );
  } else {
    let result = [];
    conn.execute(
      query +
        ", item_id, display_link, items.name, price_euros, is_fulfilled, store_id, icon_url, stores.name AS store_name " +
        "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " +
        "INNER JOIN stores USING(store_id) ORDER BY beneficiary_id",
      function(err, rows) {
        if (err) {
          console.log(err);
          res.status(400).send();
        }
        let current = -1;
        let beneficiaryObj;
        let result = [];
        rows.forEach(function(obj) {
          if (current != obj.beneficiary_id) {
            if (beneficiaryObj) {
              result.push(beneficiaryObj);
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
                  image: obj.display_link,
                  name: obj.name,
                  price: obj.price_euros,
                  fulfilled: obj.is_fulfilled,
                  storeId: obj.store_id,
                  storeName: obj.store_name,
                  icon: obj.icon_url
                }
              ]
            };
          } else {
            beneficiaryObj["needs"].push({
              itemId: obj.item_id,
              image: obj.display_link,
              name: obj.name,
              price: obj.price_euros,
              fulfilled: obj.is_fulfilled,
              storeId: obj.store_id,
              storeName: obj.store_name,
              icon: obj.icon_url
            });
          }
          current = obj.beneficiary_id;
        });
        result.push(beneficiaryObj);
        res.json(result);
      }
    );
  }
}

export default { processTypeform, getNeeds };
