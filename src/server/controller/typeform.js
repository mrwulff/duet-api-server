// Imports
require("dotenv").config();
import config from '../util/config.js';
import itemHelpers from '../util/itemHelpers.js';
import s3Helpers from '../util/s3Helpers.js';
import sqlHelpers from '../util/sqlHelpers.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from '../util/errorHandler.js';

function testUploadItemImageToS3(req, res) {
  try {
    s3Helpers.uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
    res.status(200).send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
}

async function processTypeformV4(req, res) {
  try {
    console.log("Processing TypeForm (V4)");
    let answers = req.body.form_response.answers;
    let formTitle = req.body.form_response.definition.title;
    let formQuestions = req.body.form_response.definition.fields;
    let eventId = req.body.form_response.eventId;

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
      let price = answers[5].text.replace(/,/g, '.').replace(":", ".").replace(/[^\d.]/g, '');
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

      // Translate itemName to English by matching itemName in item_types table
      // And get categoryId while we're at it
      let itemTranslationResult = await sqlHelpers.getItemNameTranslation(language, itemName);
      if (!itemTranslationResult) {
        console.log("Invalid item name! Table: name_" + language + "; itemName: " + itemName);
        res.status(500).send();
      }
      let itemNameEnglish = itemTranslationResult.name_english;
      let categoryId = itemTranslationResult.category_id;
      let storeId = await sqlHelpers.getStoreIdFromName(store);

      // insert item
      let itemId;
      try {
        itemId = await sqlHelpers.insertItemFromTypeform({
          itemNameEnglish: itemNameEnglish,
          size: size,
          price: price,
          beneficiaryId, beneficiaryId,
          categoryId: categoryId,
          storeId: storeId,
          photoUrl: photoUrl,
          in_notification: 1
        });
      } catch (err) {
        // Sendgrid Error message (email)
        sendgridHelpers.sendTypeformErrorEmail({
          formTitle: formTitle,
          eventId: eventId,
          err: err
        });
        res.status(500).send();
      }

      // get code for item
      let code = itemHelpers.generatePickupCode(itemId);
      await sqlHelpers.updateItemPickupCode(itemId, code);

      // Rehost image in S3
      let s3PhotoUrl = await s3Helpers.uploadItemImageToS3(itemId, photoUrl);
      await sqlHelpers.updateItemPhotoLink(itemId, s3PhotoUrl);

      // set notification status for store_id to be true...
      await sqlHelpers.setSingleStoreNotificationFlag(storeId);

      res.status(200).send();
    }
    else {
      console.log("Error! Invalid number of answers.");
      res.status(502).send();
    }
  } catch (err) {
    errorHandler.handleError(err, "typeform/processTypeformV4");
    res.status(500).send();
  }
}

// function processTypeformV3(req, res) {
//     // DEPRECATED
//     console.log("processing typeform");
//     let answers = req.body.form_response.answers;
//     if (answers.length > 0) {
//         let id = answers[0].text;
//         let itemName = answers[1].text;
//         let url = answers[2].file_url;
//         let category = answers[3].choice.label;
//         let price = answers[4].text;
//         let size = null;
//         let store;
//         if (answers.length == 8) {
//             size = answers[5].text;
//             store = answers[6].choice.label;
//         } else {
//             console.log(answers[5].choice);
//             store = answers[5].choice.label;
//         }
//         // get category id of item
//         conn.query(
//             "SELECT category_id FROM categories WHERE name=?",
//             [category],
//             (err, rows) => {
//                 if (err) {
//                     console.log(err);
//                     res.status(500).send({ error: err });
//                 } else if (rows.length == 0) {
//                     res.status(400).json({
//                         err: "Invalid Category Name"
//                     });
//                 } else {
//                     let category_id = rows[0].category_id;
//                     // get store id
//                     store = store.substr(0, store.indexOf("(")).trim();
//                     conn.query(
//                         "SELECT store_id FROM stores WHERE name=?",
//                         [store],
//                         (err, rows) => {
//                             if (err) {
//                                 console.log(err);
//                                 res.status(500).send({ error: err });
//                             } else if (rows.length == 0) {
//                                 res.status(400).json({
//                                     msg: "Invalid Store Name: " + store,
//                                     error: err
//                                 });
//                             } else {
//                                 let store_id = rows[0].store_id;
//                                 // insert item
//                                 conn.query(
//                                     "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,store_id,link) VALUES (?,?,?,?,?,?,?)",
//                                     [itemName, size, price, id, category_id, store_id, url],
//                                     err => {
//                                         if (err) {
//                                             console.log(err);
//                                             res.status(500).send({ error: err });
//                                         } else {
//                                             // get item of id of inserted entry
//                                             conn.execute("SELECT LAST_INSERT_ID()", function (
//                                                 err,
//                                                 rows
//                                             ) {
//                                                 if (err && rows.length < 1) {
//                                                     console.log(err);
//                                                     res.status(500).send({ error: err });
//                                                 } else {
//                                                     let itemId = rows[0]["LAST_INSERT_ID()"];
//                                                     // get code for item
//                                                     let code = itemHelpers.generatePickupCode(itemId);
//                                                     // update item pick up code
//                                                     conn.execute(
//                                                         "UPDATE items SET pickup_code=? WHERE item_id=?",
//                                                         [code, itemId],
//                                                         function (err) {
//                                                             if (err) {
//                                                                 console.log(err);
//                                                                 res.status(500).send({ error: err });
//                                                             } else {
//                                                                 res.status(200).send();
//                                                             }
//                                                         }
//                                                     );
//                                                 }
//                                             });
//                                         }
//                                     }
//                                 );

//                                 // set notification status for store_id to be true...
//                                 conn.query(
//                                     "UPDATE stores SET needs_notification=true where store_id=?",
//                                     [store_id],
//                                     err => {
//                                         if (err) {
//                                             console.log(err);
//                                             res.status(500).send({ error: err });
//                                         } else {
//                                             res.status(200).send();
//                                         }
//                                     }
//                                 );
//                             }
//                         }
//                     );
//                 }
//             }
//         );
//     }
// }

export default {
  processTypeformV4,
  testUploadItemImageToS3
};