"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _refugee = _interopRequireDefault(require("./../controller/refugee"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();
var app = (0, _express["default"])();

router.post("/typeformV3", function (req, res) {
  _refugee["default"].processTypeformV3(req, res);
});

router.post("/typeformV4", function (req, res) {
  _refugee["default"].processTypeformV4(req, res);
});var _default =

router;exports["default"] = _default;