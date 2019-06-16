// Imports
require("dotenv").config();
import config from './../config/config.js';
const conn = config.dbInitConnect();
const sgMail = config.sendgridInit();
const s3 = config.s3Init();
const request = require('request');
const path = require('path');
const mime = require('mime-types');

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
        // replace "," with "."; remove non-numeric characters
        let price = answers[5].text.replace(/,/g, '.').replace(/[^\d.]/g, '');
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
                                const in_notification = 1;
                                conn.query(
                                    // include item in notification email to store
                                    "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link,in_notification) VALUES (?,?,?,?,?,?,?,?)",
                                    [itemNameEnglish, size, price, beneficiaryId, categoryId, storeId, photoUrl, in_notification],
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
                                                                // Re-Host image to S3, update image URL in DB
                                                                var options = {
                                                                    uri: photoUrl,
                                                                    encoding: null
                                                                };
                                                                let extension = path.extname(photoUrl);
                                                                let contentType = mime.contentType(extension);
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
                                                                            ContentType: contentType
                                                                        }, function (error, data) {
                                                                            if (error) {
                                                                                console.log("error uploading image to s3: " + itemId);
                                                                                console.log("photoUrl: " + photoUrl);
                                                                                console.log(error);
                                                                                res.status(500).send({ error: err });
                                                                            } else {
                                                                                // Success
                                                                                let s3PhotoUrl = data.Location;
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

export default { processTypeformV3, processTypeformV4 };