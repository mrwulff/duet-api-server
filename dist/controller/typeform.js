"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };} // Imports
require("dotenv").config();var conn = _config["default"].dbInitConnect();
var sgMail = _config["default"].sendgridInit();
var s3 = _config["default"].s3Init();
var request = require('request');
var path = require('path');
var mime = require('mime-types');

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
    var photoUrl = answers[2].file_url;
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
                                        var s3PhotoUrl = data.Location;
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
}var _default =

{ processTypeformV3: processTypeformV3, processTypeformV4: processTypeformV4 };exports["default"] = _default;