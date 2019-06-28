"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));
var _cluster = require("cluster");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

require("dotenv").config();

var sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var request = require('request');

var path = require('path');
var mime = require('mime-types');
var AWS = require("aws-sdk");
var s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });


require("dotenv").config();

var conn = _config["default"].dbInitConnect();
var FBMessenger = require('fb-messenger');
var messenger = new FBMessenger({ token: process.env.FB_ACCESS_TOKEN });

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

function uploadItemImageToS3(itemId, imageUrl) {
  var options = {
    uri: imageUrl,
    encoding: null };

  var extension = path.extname(imageUrl);
  var contentType = mime.contentType(extension);
  request(options, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      console.log("failed to get Typeform image: " + imageUrl);
      console.log(error);
      throw error;
    } else {
      s3.upload({
        Body: body,
        Key: 'item-photos/item-' + itemId + extension,
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        ACL: "public-read",
        ContentType: contentType },
      function (error, data) {
        if (error) {
          console.log("error uploading image to s3!");
          console.log("itemId: " + itemId);
          console.log("imageUrl: " + imageUrl);
          console.log(error);
          throw error;
        } else {
          console.log("success uploading image to s3. itemId: ", itemId);
          console.log("contentType: " + contentType);
          console.log("URL: ", data.Location);
        }
      });
    }
  });
}

function testUploadItemImageToS3(req, res) {
  try {
    uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
    res.status(200).send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
}

// Adds support for GET requests to our webhook
function fbAuth(req, res) {

  // Your verify token. Should be a random string.
  var VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  // Parse the query params
  var mode = req.query['hub.mode'];
  var token = req.query['hub.verify_token'];
  var challenge = req.query['hub.challenge'];

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
  var body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      if (entry.messaging) {
        var message_obj = entry.messaging[0];
        console.log(message_obj);

        // Log message in SQL
        var sender = message_obj.sender.id;
        var recipient = message_obj.recipient.id;
        var message = message_obj.message.text;

        conn.query(
        "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
        ['fb', sender, recipient, message],
        function (err) {
          if (err) {
            console.log(err);
            res.status(500).send({ error: err });
          } else
          {
            console.log("Message logged to database");
            res.status(200).send();
          }
        });

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
  function (err, rows) {
    if (err) {
      console.log(err);
      return false;
    } else if (rows.length == 0) {
      console.log("No matches found when sending pickup notification!");
      return false;
    } else {
      var message = "Hi " + rows[0].first_name + ", this is an automated message from Duet.\n" +
      "Your " + rows[0].item_name + " is now available for pickup from " + rows[0].store_name + "!\n" +
      "Please use pick-up code: " + rows[0].pickup_code;
      try {
        messenger.sendTextMessage({
          id: rows[0].fb_psid,
          text: message,
          messaging_type: "MESSAGE_TAG",
          tag: "SHIPPING_UPDATE" });

        console.log('Sent pickup notification to ' + rows[0].first_name + " " + rows[0].last_name +
        " for " + rows[0].item_name + " with itemId: " + itemId);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  });

}

// TODO: delete this after testing
function sendTestPickupNotification(req, res) {
  var itemId = req.body.itemId;
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
  var answers = req.body.form_response.answers;
  var formTitle = req.body.form_response.definition.title;
  var formQuestions = req.body.form_response.definition.fields;

  // Check which language was used
  var language = null;
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
    var beneficiaryId = answers[0].text;
    var phoneNum = answers[1].phone_number;
    var photoUrl = encodeURI(answers[2].file_url);
    var itemName = answers[4].choice.label;
    // replace "," with "."; remove non-numeric characters
    var price = answers[5].text.replace(/,/g, '.').replace(/[^\d.]/g, '');
    var size = null;
    var store = null;
    if (answers.length == 8) {
      store = answers[6].choice.label;
    } else
    if (answers.length == 9) {
      size = answers[6].text;
      store = answers[7].choice.label;
    } else
    {
      res.status(400).json({
        msg: "Invalid number of answers :" + answers.length });

    }
    // Placeholders (require SQL lookups)
    var itemNameEnglish = null;
    var categoryId = null;
    var storeId = null;

    // Translate itemName to English by matching itemName in item_types table
    // And get categoryId while we're at it
    conn.query(
    "SELECT name_english, category_id FROM item_types WHERE ??=?",
    ["name_" + language, itemName],
    function (err, rows) {
      // Unknown error
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      }
      // No matches
      else if (rows.length == 0) {
          res.status(400).json({
            msg: "Invalid Item Name! Table: name_" + language + "; itemName: " + itemName,
            error: err });

        }
        // Found a match!
        else {
            itemNameEnglish = rows[0].name_english;
            categoryId = rows[0].category_id;
            conn.query(
            "SELECT store_id FROM stores WHERE name=?",
            [store],
            function (err, rows) {
              // Unknown error
              if (err) {
                console.log(err);
                res.status(500).send({ error: err });
              }
              // No matches
              else if (rows.length == 0) {
                  res.status(400).json({
                    msg: "Invalid Store Name: " + store,
                    error: err });

                }
                // Successful lookup
                else {
                    storeId = rows[0].store_id;
                    // insert item
                    var in_notification = 1;
                    conn.query(
                    // include item in notification email to store
                    "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link,in_notification) VALUES (?,?,?,?,?,?,?,?)",
                    [itemNameEnglish, size, price, beneficiaryId, categoryId, storeId, photoUrl, in_notification],
                    function (err) {
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
                            error: err } };


                        sgMail.
                        send(msg).
                        then(function () {
                          console.log("Sendgrid error message delived successfully.");
                        })["catch"](
                        function (error) {
                          console.error(error.toString());
                        });

                        res.status(500).send({ error: err });
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
                                // Re-Host image to S3, update image URL in DB
                                var options = {
                                  uri: photoUrl,
                                  encoding: null };

                                var extension = path.extname(photoUrl);
                                var contentType = mime.contentType(extension);
                                request(options, function (error, response, body) {
                                  if (error || response.statusCode !== 200) {
                                    console.log("failed to get Typeform image: " + photoUrl);
                                    console.log(error);
                                    res.status(500).send({ error: err });
                                  } else {
                                    s3.upload({
                                      Body: body,
                                      Key: 'item-photos/item-' + itemId + extension,
                                      Bucket: process.env.AWS_S3_BUCKET_NAME,
                                      ACL: "public-read",
                                      ContentType: contentType },
                                    function (error, data) {
                                      if (error) {
                                        console.log("error uploading image to s3: " + itemId);
                                        console.log("photoUrl: " + photoUrl);
                                        console.log(error);
                                        res.status(500).send({ error: err });
                                      } else {
                                        // Success
                                        var s3PhotoUrl = encodeURI(data.Location);
                                        console.log("success uploading image to s3. itemId: ", itemId);
                                        console.log("URL: ", s3PhotoUrl);
                                        // Update photo URL in DB
                                        conn.execute(
                                        "UPDATE items SET link=? WHERE item_id=?",
                                        [s3PhotoUrl, itemId],
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
                              }
                            });

                          }
                        });
                      }
                    });


                    // set notification status for store_id to be true...
                    conn.query(
                    "UPDATE stores SET needs_notification=true where store_id=?",
                    [storeId],
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

  } else
  {
    console.log("Error! Invalid number of answers.");
    res.status(502).send();
  }
}

function processTypeformV3(req, res) {
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
        res.status(500).send({ error: err });
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
            res.status(500).send({ error: err });
          } else if (rows.length == 0) {
            res.status(400).json({
              msg: "Invalid Store Name: " + store,
              error: err });

          } else {
            var store_id = rows[0].store_id;
            // insert item
            conn.query(
            "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link) VALUES (?,?,?,?,?,?,?)",
            [itemName, size, price, id, category_id, store_id, url],
            function (err) {
              if (err) {
                console.log(err);
                res.status(500).send({ error: err });
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
                res.status(500).send({ error: err });
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
  "SELECT beneficiary_id, first_name, last_name, story, " +
  "origin_city, origin_country, current_city, current_country, family_image_url";
  if (req.query.beneficiary_id) {
    var beneficiaryId = req.query.beneficiary_id;
    conn.execute(
    query + " FROM beneficiaries WHERE beneficiary_id = ?",
    [beneficiaryId],
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else if (rows.length == 0) {
        res.status(400).json({
          err: "Invalid Beneficiary ID" });

      } else {
        var beneficiaryObj = {
          beneficiaryId: beneficiaryId,
          firstName: rows[0].first_name,
          lastName: rows[0].last_name,
          story: rows[0].story,
          originCity: rows[0].origin_city,
          originCountry: rows[0].origin_country,
          currentCity: rows[0].current_city,
          currentCountry: rows[0].current_country,
          familyImage: rows[0].family_image_url };

        conn.execute(
        "SELECT item_id, link, items.name, pickup_code, price_euros, " +
        "status, store_id, icon_url, " +
        "stores.name as store_name, stores.google_maps as store_maps_link, " +
        "donations.timestamp as donation_timestamp " +
        "FROM items " +
        "INNER JOIN categories USING(category_id) " +
        "INNER JOIN stores USING(store_id) " +
        "LEFT JOIN donations USING(donation_id)" +
        "WHERE beneficiary_id = ?",
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
                storeMapsLink: obj.store_maps_link,
                icon: obj.icon_url,
                status: obj.status,
                pickupCode: obj.pickup_code,
                donationTimestamp: obj.donation_timestamp };

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
    ", item_id, link, items.name, pickup_code, price_euros, status, store_id, icon_url, " +
    "stores.name AS store_name, donations.timestamp AS donation_timestamp " +
    "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " +
    "INNER JOIN stores USING(store_id) LEFT JOIN donations USING(donation_id) ORDER BY beneficiary_id",
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
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
                status: obj.status,
                pickupCode: obj.pickup_code,
                donationTimestamp: obj.donation_timestamp }] };



          } else {
            beneficiaryObj["needs"].push({
              itemId: obj.item_id,
              image: obj.link,
              name: obj.name,
              price: obj.price_euros,
              storeId: obj.store_id,
              storeName: obj.store_name,
              icon: obj.icon_url,
              status: obj.status,
              pickupCode: obj.pickup_code,
              donationTimestamp: obj.donation_timestamp });

          }
          current = obj.beneficiary_id;
        });
        _result.push(beneficiaryObj);
        res.json(_result);
      }
    });

  }
}var _default =

{ processTypeformV3: processTypeformV3, processTypeformV4: processTypeformV4,
  testUploadItemImageToS3: testUploadItemImageToS3,
  fbAuth: fbAuth, sendTestPickupNotification: sendTestPickupNotification, sendPickupNotification: sendPickupNotification, processFBMessage: processFBMessage,
  getNeeds: getNeeds };exports["default"] = _default;