"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _refugee = _interopRequireDefault(require("./../controller/refugee"));
var _fbMessenger = _interopRequireDefault(require("./../controller/fbMessenger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();
var app = (0, _express["default"])();

router.get("/needs", function (req, res) {
  _refugee["default"].getNeeds(req, res);
});

router.get("/fb", function (req, res) {
  _fbMessenger["default"].fbAuth(req, res);
});

router.post("/fb", function (req, res) {
  _fbMessenger["default"].processFBMessage(req, res);
});

router.post("/fbTestPickupNotification", function (req, res) {
  _fbMessenger["default"].sendTestPickupNotification(req, res);
});

// router.post("/testUploadItemImageToS3", (req, res) => {
//   s3Controller.testUploadItemImageToS3(req, res);
// });

// router.get("/family", (req, res) => {
//   controller.getFamilyInfo(req, res);
// });
var _default =
router;exports["default"] = _default;