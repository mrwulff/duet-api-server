"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

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

function rowToItemObj(row) {
  // SQL row to item object
  var itemObj = {
    itemId: row.item_id,
    image: row.link,
    name: row.name,
    size: row.size,
    price: row.price_euros,
    storeId: row.store_id,
    storeName: row.store_name,
    storeMapsLink: row.store_maps_link,
    icon: row.icon_url,
    status: row.status,
    pickupCode: row.pickup_code,
    donationTimestamp: row.donation_timestamp };

  return itemObj;
}

function getNextItemStatus(oldStatus) {
  // Move to next item status
  var newStatus = oldStatus;
  switch (oldStatus) {
    case 'REQUESTED':
      newStatus = 'LISTED';
      break;
    case 'LISTED':
      newStatus = 'VERIFIED';
      break;
    case 'VERIFIED':
      newStatus = 'PAID';
      break;
    case 'PAID':
      newStatus = 'READY_FOR_PICKUP';
      break;
    case 'READY_FOR_PICKUP':
      newStatus = 'PICKED_UP';
      break;}

  return newStatus;
}function

listRequestedItemsAndSetNotificiationFlags() {return _listRequestedItemsAndSetNotificiationFlags.apply(this, arguments);}function _listRequestedItemsAndSetNotificiationFlags() {_listRequestedItemsAndSetNotificiationFlags = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {var requestedItems;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.prev = 0;_context2.next = 3;return (

              _sqlHelpers["default"].getItemsWithStatus('REQUESTED'));case 3:requestedItems = _context2.sent;_context2.next = 6;return (
              Promise.all(requestedItems.map( /*#__PURE__*/function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item) {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (
                            _sqlHelpers["default"].setItemNotificationFlag(item.item_id));case 2:_context.next = 4;return (
                            _sqlHelpers["default"].setSingleStoreNotificationFlag(item.store_id));case 4:_context.next = 6;return (
                            _sqlHelpers["default"].updateItemStatus('LISTED', item.item_id));case 6:
                          console.log("Successfully listed and set notification flags for item " + item.item_id);case 7:case "end":return _context.stop();}}}, _callee);}));return function (_x) {return _ref.apply(this, arguments);};}())));case 6:_context2.next = 12;break;case 8:_context2.prev = 8;_context2.t0 = _context2["catch"](0);


            _errorHandler["default"].handleError(_context2.t0, "itemHelpers/listRequestedItems");throw _context2.t0;case 12:case "end":return _context2.stop();}}}, _callee2, null, [[0, 8]]);}));return _listRequestedItemsAndSetNotificiationFlags.apply(this, arguments);}var _default =




{
  generatePickupCode: generatePickupCode,
  rowToItemObj: rowToItemObj,
  getNextItemStatus: getNextItemStatus,
  listRequestedItemsAndSetNotificiationFlags: listRequestedItemsAndSetNotificiationFlags };exports["default"] = _default;