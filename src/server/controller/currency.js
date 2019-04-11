import db from "./../config/config.js";
import request from "request";

function updateCurrencyRates(req, res) {
  request(
    "https://openexchangerates.org/api/latest.json?app_id=7f0785f2b1bc4741b374c04b20d229a6",
    (error, response, body) => {
      if (error) {
        console.log(error);
        res.status(500).send();
      } else {
        let rates = JSON.parse(response.body).rates;
        for (let code in rates) {
          if (rates.hasOwnProperty(code)) {
            console.log(code + " -> " + rates[code]);
          }
        }
      }
    }
  );
}

export default { updateCurrencyRates };
