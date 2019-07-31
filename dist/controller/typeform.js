"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("../util/config.js"));
var _itemHelpers = _interopRequireDefault(require("../util/itemHelpers.js"));
var _s3Helpers = _interopRequireDefault(require("../util/s3Helpers.js"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _sendgridHelpers = _interopRequireDefault(require("../util/sendgridHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));
var _typeformHelpers = _interopRequireDefault(require("../util/typeformHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();
// function testUploadItemImageToS3(req, res) {
//   try {
//     s3Helpers.uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
//     res.status(200).send();
//   } catch (e) {
//     res.status(500).send({ error: e });
//   }
// }
function

processTypeformV4(_x, _x2) {return _processTypeformV.apply(this, arguments);}
























































































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
function _processTypeformV() {_processTypeformV = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {var answers, formTitle, formQuestions, eventId, language, beneficiaryId, phoneNum, photoUrl, itemName, price, size, comment, store, itemTranslationResult, itemNameEnglish, categoryId, storeId, itemId, _sqlHelpers$insertIte, code, s3PhotoUrl;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;console.log("Processing TypeForm (V4)");answers = req.body.form_response.answers;formTitle = req.body.form_response.definition.title;formQuestions = req.body.form_response.definition.fields;eventId = req.body.form_response.eventId; // Check which language was used
            language = null;if (!formTitle.includes("English")) {_context.next = 11;break;}language = "english";_context.next = 20;break;case 11:if (!formTitle.includes("Arabic")) {_context.next = 15;break;}language = "arabic";_context.next = 20;break;case 15:if (!formTitle.includes("Farsi")) {_context.next = 19;break;}language = "farsi";_context.next = 20;break;case 19:throw Error("Unknown Typeform language");case 20: // Get responses
            beneficiaryId = _typeformHelpers["default"].getAnswerFromQuestionReference("beneficiary-code", answers, 'text');phoneNum = _typeformHelpers["default"].getAnswerFromQuestionReference("phone-num", answers, 'phone_number');photoUrl = encodeURI(_typeformHelpers["default"].getAnswerFromQuestionReference("item-photo", answers, 'file'));itemName = _typeformHelpers["default"].getAnswerFromQuestionReference("item-name", answers, 'choice'); // replace "," with "."; remove non-numeric characters
            price = _typeformHelpers["default"].getAnswerFromQuestionReference("item-price", answers, 'text').replace(/,/g, '.').replace(":", ".").replace(/[^\d.]/g, '');size = _typeformHelpers["default"].getAnswerFromQuestionReference("item-size", answers, 'text'); // might be null
            comment = _typeformHelpers["default"].getAnswerFromQuestionReference("comment", answers, 'text'); // might be null
            store = _typeformHelpers["default"].getAnswerFromQuestionReference("store-name", answers, 'choice');if (!(isNaN(price) || price <= 0)) {_context.next = 30;break;}throw Error("Invalid price: " + _typeformHelpers["default"].getAnswerFromQuestionReference("item-price", answers, 'text'));case 30:_context.next = 32;return _sqlHelpers["default"].getItemNameTranslation(language, itemName);case 32:itemTranslationResult = _context.sent;if (itemTranslationResult) {_context.next = 35;break;}throw Error("Invalid item name! Table: name_" + language + "; itemName: " + itemName);case 35:itemNameEnglish = itemTranslationResult.name_english;categoryId = itemTranslationResult.category_id;_context.next = 39;return _sqlHelpers["default"].getStoreIdFromName(store);case 39:storeId = _context.sent;_context.prev = 40;_context.next = 43;return _sqlHelpers["default"].insertItemFromTypeform((_sqlHelpers$insertIte = { itemNameEnglish: itemNameEnglish, size: size, price: price, beneficiaryId: beneficiaryId }, _defineProperty(_sqlHelpers$insertIte, "beneficiaryId", beneficiaryId), _defineProperty(_sqlHelpers$insertIte, "categoryId", categoryId), _defineProperty(_sqlHelpers$insertIte, "comment", comment), _defineProperty(_sqlHelpers$insertIte, "storeId", storeId), _defineProperty(_sqlHelpers$insertIte, "photoUrl", photoUrl), _defineProperty(_sqlHelpers$insertIte, "in_notification", 1), _sqlHelpers$insertIte));case 43:itemId = _context.sent;_context.next = 51;break;case 46:_context.prev = 46;_context.t0 = _context["catch"](40); // Sendgrid Error message (email)
            console.log("Failed to insert item from typeform into DB. Sending error email...");_sendgridHelpers["default"].sendTypeformErrorEmail({ formTitle: formTitle, eventId: eventId, err: _context.t0 });return _context.abrupt("return", res.status(500).send());case 51: // get code for item
            code = _itemHelpers["default"].generatePickupCode(itemId);_context.next = 54;return _sqlHelpers["default"].updateItemPickupCode(itemId, code);case 54:_context.next = 56;return _s3Helpers["default"].uploadItemImageToS3(itemId, photoUrl);case 56:s3PhotoUrl = _context.sent;_context.next = 59;return _sqlHelpers["default"].updateItemPhotoLink(itemId, s3PhotoUrl);case 59:_context.next = 61;return _sqlHelpers["default"].setSingleStoreNotificationFlag(storeId);case 61:console.log("Successfully processed Typeform response");return _context.abrupt("return", res.status(200).send());case 65:_context.prev = 65;_context.t1 = _context["catch"](0);_errorHandler["default"].handleError(_context.t1, "typeform/processTypeformV4");return _context.abrupt("return", res.status(500).send());case 69:case "end":return _context.stop();}}}, _callee, null, [[0, 65], [40, 46]]);}));return _processTypeformV.apply(this, arguments);}var _default = { processTypeformV4: processTypeformV4 // testUploadItemImageToS3
};exports["default"] = _default;