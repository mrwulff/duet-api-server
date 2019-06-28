"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _express = _interopRequireDefault(require("express"));
var _index = _interopRequireDefault(require("./../controller/index"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

var router = _express["default"].Router();

router.get("/status", function (req, res) {
  res.json({
    status: "ok" });

});

router.post("/login", function (req, res) {
  _index["default"].login(req, res);
});

router.post("/signup", function (req, res) {
  _index["default"].createUser(req, res);
});var _default =

router;exports["default"] = _default;