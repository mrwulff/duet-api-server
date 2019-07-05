"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("./../util/config.js"));
var _request = _interopRequireDefault(require("request"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

function updateCurrencyRates(req, res) {
  (0, _request["default"])(
  "https://openexchangerates.org/api/latest.json?app_id=7f0785f2b1bc4741b374c04b20d229a6",
  function (error, response, body) {
    if (error) {
      console.log(error);
      res.status(500).send();
    } else {
      var rates = JSON.parse(response.body).rates;
      for (var code in rates) {
        if (rates.hasOwnProperty(code)) {
          console.log(code + " -> " + rates[code]);
        }
      }
    }
  });

}var _default =

{ updateCurrencyRates: updateCurrencyRates };exports["default"] = _default;