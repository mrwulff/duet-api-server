"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _confirmation = _interopRequireDefault(require("./../controller/confirmation"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();

router.post("/confirmation", function (req, res) {
  _confirmation["default"].sendConfirmationEmail(req, res);
});var _default =

router;exports["default"] = _default;