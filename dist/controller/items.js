"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _fbHelpers = _interopRequireDefault(require("../util/fbHelpers.js"));
var _itemHelpers = _interopRequireDefault(require("../util/itemHelpers.js"));
var _sendgridHelpers = _interopRequireDefault(require("../util/sendgridHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function

getItems(_x, _x2) {return _getItems.apply(this, arguments);}function _getItems() {_getItems = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {var item, rows, needs, _rows, _needs;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;if (!



            req.query.item_id) {_context.next = 8;break;}_context.next = 4;return (
              _sqlHelpers["default"].getItem(req.query.item_id));case 4:item = _context.sent;return _context.abrupt("return",
            res.json([item]));case 8:if (!


            req.query.store_id) {_context.next = 19;break;}_context.next = 11;return (
              _sqlHelpers["default"].getItemsForStore(req.query.store_id));case 11:rows = _context.sent;if (!(
            rows.length === 0)) {_context.next = 14;break;}return _context.abrupt("return",
            res.send([]));case 14:

            needs = [];
            rows.forEach(function (row) {
              needs.push(_itemHelpers["default"].getFrontEndItemObj(row));
            });return _context.abrupt("return",
            res.json(needs));case 19:_context.next = 21;return (



              _sqlHelpers["default"].getAllItems());case 21:_rows = _context.sent;if (!(
            _rows.length === 0)) {_context.next = 24;break;}return _context.abrupt("return",
            res.send([]));case 24:

            _needs = [];
            _rows.forEach(function (row) {
              _needs.push(_itemHelpers["default"].getFrontEndItemObj(row));
            });return _context.abrupt("return",
            res.json(_needs));case 27:_context.next = 33;break;case 29:_context.prev = 29;_context.t0 = _context["catch"](0);



            _errorHandler["default"].handleError(_context.t0, "items/getItems");return _context.abrupt("return",
            res.status(500).send());case 33:case "end":return _context.stop();}}}, _callee, null, [[0, 29]]);}));return _getItems.apply(this, arguments);}function



updateItemStatus(_x3, _x4) {return _updateItemStatus.apply(this, arguments);}










































// NOTE: DEPRECATED. Use updateItemStatus route
// function verifyItems(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='VERIFIED' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, (err, rows) => {
//       if (err) {
//         console.log(err);
//         res.status(400).send();
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to VERIFIED"
//         });
//       }
//     });
//   }
// }

// NOTE: DEPRECATED. Use updateItemStatus route
// function readyForPickup(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='READY_FOR_PICKUP' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, err => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({
//           err: err
//         });
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to READY_FOR_PICKUP"
//         });
//       }
//     });
//   }
// }

// NOTE: DEPRECATED. Use updateItemStatus route
// function pickupConfirmation(req, res) {
//   if (req.body.itemIds.length > 0) {
//     let query = "UPDATE items SET status='PICKED_UP' WHERE 1=1 AND (";
//     req.body.itemIds.forEach(id => {
//       query += "item_id=" + id + " OR ";
//     });
//     query += "1=0);";
//     conn.query(query, err => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({
//           err: err
//         });
//       } else {
//         res.status(200).json({
//           msg: "Item status updated to PICKED_UP"
//         });
//       }
//     });
//   }
// }
function _updateItemStatus() {_updateItemStatus = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0: // Update status for list of items
            // Important: make sure all items are being updated to the same status!
            try {if (Array.isArray(req.body.items)) {if (req.body.items.length > 0) {req.body.items.forEach( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(item) {var newStatus, itemResult, _itemResult;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0: // Update item status in DB
                              newStatus = _itemHelpers["default"].getNextItemStatus(item.status);_context2.next = 3;return _sqlHelpers["default"].updateItemStatus(newStatus, item.itemId);case 3:_context2.next = 5;return _sqlHelpers["default"].getItem(item.itemId);case 5:itemResult = _context2.sent;if (itemResult) {_sendgridHelpers["default"].sendItemStatusUpdateEmail(itemResult);} // FB messenger pickup notification
                              if (!(newStatus === 'READY_FOR_PICKUP')) {_context2.next = 11;break;}_fbHelpers["default"].sendPickupNotification(item.itemId);_context2.next = 16;break;case 11:if (!(newStatus === 'PICKED_UP')) {_context2.next = 16;break;}_context2.next = 14;return _sqlHelpers["default"].getItem(item.itemId);case 14:_itemResult = _context2.sent;if (_itemResult) {_sendgridHelpers["default"].sendItemPickedUpEmail(_itemResult);}case 16:case "end":return _context2.stop();}}}, _callee2);}));return function (_x5) {return _ref.apply(this, arguments);};}());}res.status(200).send();} else {res.status(400).json({ error: 'invalid request body' });}} catch (err) {_errorHandler["default"].handleError(err, "items/updateItemStatus");res.status(500).send();}case 1:case "end":return _context3.stop();}}}, _callee3);}));return _updateItemStatus.apply(this, arguments);}var _default = { getItems: getItems, updateItemStatus: updateItemStatus // verifyItems,
  // readyForPickup,
  // pickupConfirmation,
};exports["default"] = _default;