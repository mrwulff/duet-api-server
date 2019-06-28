"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _itemHelpers = _interopRequireDefault(require("../util/itemHelpers.js"));
var _s3Helpers = _interopRequireDefault(require("../util/s3Helpers.js"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();var conn = _config["default"].dbInitConnect();
var sgMail = _config["default"].sendgridInit();

function testUploadItemImageToS3(req, res) {
  try {
    _s3Helpers["default"].uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
    res.status(200).send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
}function

processTypeformV4(_x, _x2) {return _processTypeformV.apply(this, arguments);}function _processTypeformV() {_processTypeformV = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {var answers, formTitle, formQuestions, eventId, language, beneficiaryId, phoneNum, photoUrl, itemName, price, size, store, itemTranslationResult, itemNameEnglish, categoryId, storeId, itemId, _sqlHelpers$insertIte, code, s3PhotoUrl;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            console.log("Processing TypeForm (V4)");
            answers = req.body.form_response.answers;
            formTitle = req.body.form_response.definition.title;
            formQuestions = req.body.form_response.definition.fields;
            eventId = req.body.form_response.eventId;

            // Check which language was used
            language = null;
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
            if (!(answers.length >= 8)) {_context.next = 49;break;}
            beneficiaryId = answers[0].text;
            phoneNum = answers[1].phone_number;
            photoUrl = answers[2].file_url;
            itemName = answers[4].choice.label;
            // replace "," with "."; remove non-numeric characters
            price = answers[5].text.replace(/,/g, '.').replace(/[^\d.]/g, '');
            size = null;
            store = null;
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

            // Translate itemName to English by matching itemName in item_types table
            // And get categoryId while we're at it
            _context.next = 18;return _sqlHelpers["default"].getItemNameTranslation(language, itemName);case 18:itemTranslationResult = _context.sent;
            if (!itemTranslationResult) {
              console.log("Invalid item name! Table: name_" + language + "; itemName: " + itemName);
              res.status(500).send();
            }
            itemNameEnglish = itemTranslationResult.name_english;
            categoryId = itemTranslationResult.category_id;_context.next = 24;return (
              _sqlHelpers["default"].getStoreIdFromName(store));case 24:storeId = _context.sent;_context.prev = 25;_context.next = 28;return (




              _sqlHelpers["default"].insertItemFromTypeform((_sqlHelpers$insertIte = {
                itemNameEnglish: itemNameEnglish,
                size: size,
                price: price,
                beneficiaryId: beneficiaryId }, _defineProperty(_sqlHelpers$insertIte, "beneficiaryId", beneficiaryId), _defineProperty(_sqlHelpers$insertIte, "categoryId",
              categoryId), _defineProperty(_sqlHelpers$insertIte, "storeId",
              storeId), _defineProperty(_sqlHelpers$insertIte, "photoUrl",
              photoUrl), _defineProperty(_sqlHelpers$insertIte, "in_notification",
              1), _sqlHelpers$insertIte)));case 28:itemId = _context.sent;_context.next = 36;break;case 31:_context.prev = 31;_context.t0 = _context["catch"](25);


            // Sendgrid Error message (email)
            msg = {
              to: "duet.giving@gmail.com",
              from: "duet.giving@gmail.com",
              templateId: "d-6ecc5d7df32c4528b8527c248a212552",
              dynamic_template_data: {
                formTitle: formTitle,
                eventId: eventId,
                error: _context.t0 } };


            sgMail.
            send(msg).
            then(function () {
              console.log("Sendgrid error message delived successfully.");
            })["catch"](
            function (error) {
              console.error(error.toString());
            });
            res.status(500).send();case 36:


            // get code for item
            code = _itemHelpers["default"].generatePickupCode(itemId);_context.next = 39;return (
              _sqlHelpers["default"].updateItemPickupCode(itemId, code));case 39:_context.next = 41;return (


              _s3Helpers["default"].uploadItemImageToS3(itemId, photoUrl));case 41:s3PhotoUrl = _context.sent;_context.next = 44;return (
              _sqlHelpers["default"].updateItemPhotoLink(itemId, s3PhotoUrl));case 44:_context.next = 46;return (


              _sqlHelpers["default"].setSingleStoreNotificationFlag(storeId));case 46:

            res.status(200).send();_context.next = 51;break;case 49:


            console.log("Error! Invalid number of answers.");
            res.status(502).send();case 51:case "end":return _context.stop();}}}, _callee, null, [[25, 31]]);}));return _processTypeformV.apply(this, arguments);}



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
                    var code = _itemHelpers["default"].generatePickupCode(itemId);
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

{
  processTypeformV3: processTypeformV3,
  processTypeformV4: processTypeformV4,
  testUploadItemImageToS3: testUploadItemImageToS3 };exports["default"] = _default;