import db from "./../config/config.js";
import { getMaxListeners } from "cluster";

require("dotenv").config();

var sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const conn = db.dbInitConnect();
const FBMessenger = require('fb-messenger');
const messenger = new FBMessenger({ token: process.env.FB_ACCESS_TOKEN });

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

// Adds support for GET requests to our webhook
function fbAuth(req, res) {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

// Handles FB message events
// See: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
function processFBMessage(req, res) {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      if (entry.messaging) {
        let message_obj = entry.messaging[0];
        console.log(message_obj);

        // Log message in SQL
        let sender = message_obj.sender.id;
        let recipient = message_obj.recipient.id;
        let message = message_obj.message.text;

        conn.query(
          "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
          ['fb', sender, recipient, message],
          err => {
            if (err) {
              console.log(err);
              res.status(500).send({ error: err });
            }
            else {
              console.log("Message logged to database");
              res.status(200).send();
            }
          }
        );
      }
    });

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

function sendPickupNotification(itemId) {
  conn.query(
    "SELECT " +
    "items.name AS item_name, items.pickup_code, " +
    "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " +
    "stores.name AS store_name " + 
    "FROM items " + 
    "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " + 
    "INNER JOIN stores ON items.store_id = stores.store_id " +
    "WHERE items.item_id=?",
    [itemId],
    (err, rows) => {
      if (err) {
        console.log(err);
        return false;
      } else if (rows.length == 0) {
        console.log("No matches found when sending pickup notification!");
        return false;
      } else {
        let message = "Hi " + rows[0].first_name + ", this is an automated message from Duet.\n" +
          "Your " + rows[0].item_name + " is now available for pickup from " + rows[0].store_name + "!\n" +
          "Please use pick-up code: " + rows[0].pickup_code;
        try {
          messenger.sendTextMessage({
            id: rows[0].fb_psid,
            text: message,
            messaging_type: "MESSAGE_TAG",
            tag: "SHIPPING_UPDATE"
          });
          console.log('Sent pickup notification to ' + rows[0].first_name + " " + rows[0].last_name +
            " for " + rows[0].item_name + " with itemId: " + itemId);
          return true;
        } catch (e) {
          console.error(e);
          return false;
        }
      }
    }
  );
}

// TODO: delete this after testing
function sendTestPickupNotification(req, res) {
  let itemId = req.body.itemId;
  try {
    sendPickupNotification(itemId);
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
  res.status(200).send();
}

function processTypeformV4(req, res) {
  console.log("Processing TypeForm (V4)");
  let answers = req.body.form_response.answers;
  let formTitle = req.body.form_response.definition.title;
  let formQuestions = req.body.form_response.definition.fields;

  // Check which language was used
  let language = null;
  if (formTitle.includes("English")) {
    language = "english";
  } else if (formTitle.includes("Arabic")) {
    language = "arabic";
  } else if (formTitle.includes("Farsi")) {
    language = "farsi";
  } else {
    console.log("Error! Unknown Typeform language.");
    res.status(501).send();
  }

  // Get responses
  if (answers.length >= 8) {
    let beneficiaryId = answers[0].text;
    let phoneNum = answers[1].phone_number;
    let photoUrl = answers[2].file_url;
    let itemName = answers[4].choice.label;
    let price = answers[5].text;
    let size = null;
    let store = null;
    if (answers.length == 8) {
      store = answers[6].choice.label;
    }
    else if (answers.length == 9) {
      size = answers[6].text;
      store = answers[7].choice.label;
    }
    else {
      res.status(400).json({
        msg: ("Invalid number of answers :" + answers.length)
      });
    }
    // Placeholders (require SQL lookups)
    let itemNameEnglish = null;
    let categoryId = null;
    let storeId = null;

    // Translate itemName to English by matching itemName in item_types table
    // And get categoryId while we're at it
    conn.query(
      "SELECT name_english, category_id FROM item_types WHERE ??=?",
      ["name_" + language, itemName],
      (err, rows) => {
        // Unknown error
        if (err) {

          
          console.log(err);
          res.status(500).send({ error: err });
        }
        // No matches
        else if (rows.length == 0) {
          res.status(400).json({
            msg: ("Invalid Item Name! Table: name_" + language + "; itemName: " + itemName),
            error: err
          });
        }
        // Found a match!
        else {
          itemNameEnglish = rows[0].name_english;
          categoryId = rows[0].category_id;
          conn.query(
            "SELECT store_id FROM stores WHERE name=?",
            [store],
            (err, rows) => {
              // Unknown error
              if (err) {
                console.log(err);
                res.status(500).send({ error: err });
              }
              // No matches
              else if (rows.length == 0) {
                res.status(400).json({
                  msg: "Invalid Store Name: " + store,
                  error: err
                });
              }
              // Successful lookup
              else {
                storeId = rows[0].store_id;
                // insert item
                conn.query(
                  "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link) VALUES (?,?,?,?,?,?,?)",
                  [itemNameEnglish, size, price, beneficiaryId, categoryId, storeId, photoUrl],
                  err => {
                    if (err) {
                      console.log("Typeform Database entry error!");
                      console.log(err);

                      // Sendgrid Error message (email)
                      msg = {
                        to: "duet.giving@gmail.com",
                        from: "duet.giving@gmail.com",
                        templateId: "d-6ecc5d7df32c4528b8527c248a212552",
                        dynamic_template_data: {
                          formTitle: formTitle,
                          eventId: eventId,
                          error: err
                        }
                      }
                      sgMail
                        .send(msg)
                        .then(() => {
                          console.log("Sendgrid error message delived successfully.");
                        })
                        .catch(error => {
                          console.error(error.toString());
                        });
                      
                      res.status(500).send({ error: err });
                    } else {
                      // get item of id of inserted entry
                      conn.execute("SELECT LAST_INSERT_ID()", function (
                        err,
                        rows
                      ) {
                        if (err && rows.length < 1) {
                          console.log(err);
                          res.status(500).send({ error: err });
                        } else {
                          let itemId = rows[0]["LAST_INSERT_ID()"];
                          // get code for item
                          let code = generatePickupCode(itemId);
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
                            }
                          );
                        }
                      });
                    }
                  }
                );

                // set notification status for store_id to be true...
                conn.query(
                  "UPDATE stores SET needs_notification=true where store_id=?",
                  [storeId],
                  err => {
                    if (err) {
                      console.log(err);
                      res.status(500).send({ error: err });
                    } else {
                      res.status(200).send();
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
  else {
    console.log("Error! Invalid number of answers.");
    res.status(502).send();
  }
}

function processTypeformV3(req, res) {
  console.log("processing typeform");
  let answers = req.body.form_response.answers;
  if (answers.length > 0) {
    let id = answers[0].text;
    let itemName = answers[1].text;
    let url = answers[2].file_url;
    let category = answers[3].choice.label;
    let price = answers[4].text;
    let size = null;
    let store;
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
      (err, rows) => {
        if (err) {
          console.log(err);
          res.status(500).send({ error: err });
        } else if (rows.length == 0) {
          res.status(400).json({
            err: "Invalid Category Name"
          });
        } else {
          let category_id = rows[0].category_id;
          // get store id
          store = store.substr(0, store.indexOf("(")).trim();
          conn.query(
            "SELECT store_id FROM stores WHERE name=?",
            [store],
            (err, rows) => {
              if (err) {
                console.log(err);
                res.status(500).send({ error: err });
              } else if (rows.length == 0) {
                res.status(400).json({
                  msg: "Invalid Store Name: " + store,
                  error: err
                });
              } else {
                let store_id = rows[0].store_id;
                // insert item
                conn.query(
                  "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link) VALUES (?,?,?,?,?,?,?)",
                  [itemName, size, price, id, category_id, store_id, url],
                  err => {
                    if (err) {
                      console.log(err);
                      res.status(500).send({ error: err });
                    } else {
                      // get item of id of inserted entry
                      conn.execute("SELECT LAST_INSERT_ID()", function (
                        err,
                        rows
                      ) {
                        if (err && rows.length < 1) {
                          console.log(err);
                          res.status(500).send({ error: err });
                        } else {
                          let itemId = rows[0]["LAST_INSERT_ID()"];
                          // get code for item
                          let code = generatePickupCode(itemId);
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
                            }
                          );
                        }
                      });
                    }
                  }
                );

                // set notification status for store_id to be true...
                conn.query(
                  "UPDATE stores SET needs_notification=true where store_id=?",
                  [store_id],
                  err => {
                    if (err) {
                      console.log(err);
                      res.status(500).send({ error: err });
                    } else {
                      res.status(200).send();
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
}

function getNeeds(req, res) {
  let query =
    "SELECT beneficiary_id, first_name, last_name, story, " +
    "origin_city, origin_country, current_city, current_country, family_image_url";
  if (req.query.beneficiary_id) {
    let beneficiaryId = req.query.beneficiary_id;
    conn.execute(
      query + " FROM beneficiaries WHERE beneficiary_id = ?",
      [beneficiaryId],
      function (err, rows) {
        if (err) {
          console.log(err);
          res.status(500).send({ error: err });
        } else if (rows.length == 0) {
          res.status(400).json({
            err: "Invalid Beneficiary ID"
          });
        } else {
          let beneficiaryObj = {
            beneficiaryId: beneficiaryId,
            firstName: rows[0].first_name,
            lastName: rows[0].last_name,
            story: rows[0].story,
            originCity: rows[0].origin_city,
            originCountry: rows[0].origin_country,
            currentCity: rows[0].current_city,
            currentCountry: rows[0].current_country,
            familyImage: rows[0].family_image_url
          };
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
                  msg: "Beneficiary Has No Item Needs"
                });
              } else {
                let item;
                let needs = [];
                rows.forEach(function (obj) {
                  item = {
                    itemId: obj.item_id,
                    image: obj.link,
                    name: obj.name,
                    price: obj.price_euros,
                    storeId: obj.store_id,
                    storeName: obj.store_name,
                    icon: obj.icon_url,
                    status: obj.status
                  };
                  needs.push(item);
                });
                beneficiaryObj["needs"] = needs;
                res.json(beneficiaryObj);
              }
            }
          );
        }
      }
    );
  } else {
    let result = [];
    conn.execute(
      query +
      ", item_id, link, items.name, price_euros, status, store_id, icon_url, stores.name AS store_name " +
      "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " +
      "INNER JOIN stores USING(store_id) ORDER BY beneficiary_id",
      function (err, rows) {
        if (err) {
          console.log(err);
          res.status(500).send({ error: err });
        } else if (rows.length == 0) {
          res.json({
            msg: "No Item Needs"
          });
        } else {
          let current = -1;
          let beneficiaryObj;
          let result = [];
          rows.forEach(function (obj) {
            if (current != obj.beneficiary_id) {
              if (beneficiaryObj) {
                result.push(beneficiaryObj);
              }
              beneficiaryObj = {
                beneficiaryId: obj.beneficiary_id,
                firstName: obj.first_name,
                lastName: obj.last_name,
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
                    status: obj.status
                  }
                ]
              };
            } else {
              beneficiaryObj["needs"].push({
                itemId: obj.item_id,
                image: obj.link,
                name: obj.name,
                price: obj.price_euros,
                storeId: obj.store_id,
                storeName: obj.store_name,
                icon: obj.icon_url,
                status: obj.status
              });
            }
            current = obj.beneficiary_id;
          });
          result.push(beneficiaryObj);
          res.json(result);
        }
      }
    );
  }
}

export default { processTypeformV3, processTypeformV4, fbAuth, sendTestPickupNotification, sendPickupNotification, processFBMessage, getNeeds };
