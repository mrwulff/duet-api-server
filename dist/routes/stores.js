"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _stores = _interopRequireDefault(require("./../controller/stores"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();

router.post("/login", function (req, res) {
  _stores["default"].login(req, res);
});var _default =

router;exports["default"] = _default;