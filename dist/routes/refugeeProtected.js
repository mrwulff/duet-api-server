"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _typeform = _interopRequireDefault(require("./../controller/typeform"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();
var app = (0, _express["default"])();

// router.post("/typeformV3", (req, res) => {
//   typeformController.processTypeformV3(req, res);
// });

router.post("/typeformV4", function (req, res) {
  _typeform["default"].processTypeformV4(req, res);
});var _default =

router;exports["default"] = _default;