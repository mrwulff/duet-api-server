"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _donate = _interopRequireDefault(require("./../controller/donate"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();

router.post("/paid", function (req, res) {
  _donate["default"].itemPaid(req, res);
  //controller.sendConfirmationEmail(req, res);
});

router.post("/testStoreownerConfirmationEmail", function (req, res) {
  _donate["default"].sendStoreownerNotificationEmail(req, res);
});

router.post("/testResponse", function (req, res) {
  res.status(200).send("hit endpoint successfully");
});

router.use("/testDBConnection", function (req, res) {
  var success = _donate["default"].testDBConnection(req, res);
});

router.use("/updateNotificationFlag", function (req, res) {
  _donate["default"].updateNotificationFlag(req, res);
});var _default =

router;exports["default"] = _default;