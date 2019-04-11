"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _express = _interopRequireDefault(require("express"));
var _donate = _interopRequireDefault(require("./../controller/donate"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var router = _express.default.Router();

router.post("/fulfill", function (req, res) {
  _donate.default.fulfillNeed(req, res);
});

router.post("/paid", function (req, res) {
  _donate.default.itemPaid(req, res);
  _donate.default.sendConfirmationEmail(req, res);
});var _default =

router;exports.default = _default;