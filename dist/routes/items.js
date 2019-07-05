"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _items = _interopRequireDefault(require("./../controller/items"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();

router.get("/", function (req, res) {
  _items["default"].getItems(req, res);
});

router.post("/updateItemStatus", function (req, res) {
  _items["default"].updateItemStatus(req, res);
});

// router.post("/verify", (req, res) => {
//   controller.verifyItems(req, res);
// });

// router.post("/pickup/ready", (req, res) => {
//   controller.readyForPickup(req, res);
// });

// router.post("/pickup/confirmation", (req, res) => {
//   controller.pickupConfirmation(req, res);
// });
var _default =
router;exports["default"] = _default;