import db from "./../config/config.js";
import refugee from "./refugee.js";

const conn = db.dbInitConnect();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function getItems(req, res) {
  let query =
    "SELECT item_id, size, link, items.name, pickup_code, price_euros, " +
      "status, store_id, icon_url, " +
      "stores.name as store_name, stores.google_maps as store_maps_link, " +
      "donations.timestamp as donation_timestamp " +
    "FROM items " +
    "INNER JOIN categories USING(category_id) " +
    "INNER JOIN stores USING(store_id) " +
    "LEFT JOIN donations USING(donation_id)";
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
          image: obj.link,
          name: obj.name,
          size: obj.size,
          price: obj.price_euros,
          storeId: obj.store_id,
          storeName: obj.store_name,
          storeMapsLink: obj.store_maps_link,
          icon: obj.icon_url,
          status: obj.status,
          pickupCode: obj.pickup_code,
          donationTimestamp: obj.donation_timestamp
        };
        needs.push(item);
      });
      res.json(needs);
    }
  });
}

function updateItemStatus(req, res) {
  if (Array.isArray(req.body.items)) {
    if (req.body.items.length > 0) {
      req.body.items.forEach(function(item) {
        let newStatus = item.status;
        switch(item.status) {
          case 'LISTED':
            newStatus = 'VERIFIED';
            break;
          case 'PAID':
            newStatus = 'READY_FOR_PICKUP';
            break;
          case 'READY_FOR_PICKUP':
            newStatus = 'PICKED_UP';
            break;
        }

        let query;
        if (newStatus === 'PAID') {
          query = `UPDATE items SET status='${newStatus}', in_notification=1 WHERE item_id in (${req.body.items.map(item => item.itemId).join()})`
        } else {
          query = `UPDATE items SET status='${newStatus}' WHERE item_id in (${req.body.items.map(item => item.itemId).join()})`;
        }

        conn.query(query, (err, rows) => {
          if (err) {
            console.log(err);
            return res.status(400).send();
          }
        });
  
        // Facebook messenger pickup notification
        if (newStatus === 'READY_FOR_PICKUP') {
          req.body.items.forEach(item => {
            refugee.sendPickupNotification(item.itemId);
          });
        }
  
        // Sendgrid notification
        if (newStatus === 'READY_FOR_PICKUP' || newStatus === 'PICKED_UP') {
          const emailTemplateId = newStatus === 'READY_FOR_PICKUP' ? 'd-15967181f418425fa3510cb674b7f580' : 'd-2e5e32e85d614b338e7e27d3eacccac3';
  
          req.body.items.forEach(item => {
            // send an email for each item
            let itemQuery =
            `SELECT item_id, size, link, items.name, pickup_code, price_euros, store_id, beneficiary_id, stores.name as store_name, beneficiaries.first_name as beneficiary_first, beneficiaries.last_name as beneficiary_last FROM items
            INNER JOIN stores USING(store_id) INNER JOIN beneficiaries USING(beneficiary_id) WHERE item_id=${item.itemId}`;
  
            conn.execute(itemQuery, function(err, rows) {
              if (err) {
                console.log(err);
                return;
              } else if (rows.length === 0) {
                console.log('no items ready for pickup or picked-up');
              } else {
                // send email to Duet if item is ready to pick-up:
                const msg = {
                  to: "duet.giving@gmail.com",
                  from: "duet.giving@gmail.com",
                  templateId: emailTemplateId,
                  dynamic_template_data: {
                    itemName: rows[0].name,
                    itemSize: rows[0].size,
                    itemLink: rows[0].link,
                    pickupCode: rows[0].pickup_code,
                    refugeeName: `${rows[0].beneficiary_first} ${rows[0].beneficiary_last}`,
                    refugeeId: rows[0].beneficiary_id,
                    storeName: rows[0].store_name,
                  }
                };
          
                sgMail
                  .send(msg)
                  .then(() => {
                    console.log(`Item pickup or ready to be picked up message delivered to Duet successfully.`);
                  })
                  .catch(error => {
                    console.error("Error: " + error.toString());
                    return;
                  });
              }
            });
          })
        }
      });
      res.status(200).send();      
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
        // req.body.itemIds.forEach(id => sendPickupNotification(id)); - TODO: enable this
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
