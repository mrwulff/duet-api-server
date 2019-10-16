const rp = require('request-promise');
import errorHandler from '../util/errorHandler.js';

// Cached currency rates
let currencyRates;

// Get currency rates in openexchangerates format
async function updateCurrencyRates() {
  try {
    const options = {
      uri: "https://openexchangerates.org/api/latest.json?app_id=7f0785f2b1bc4741b374c04b20d229a6",
      json: true
    }
    currencyRates = await rp(options);
    console.log("Updated currency rate! EUR in USD: " + currencyRates.rates.EUR);
  } catch (err) {
    errorHandler.handleError(err, "currencyHelpers/updateCurrencyRates");
    throw err;
  }
}

// Return latest currency rates
async function getCurrencyRates() {
  try {
    if (!currencyRates) {
      await updateCurrencyRates();
    }
    return currencyRates;
  } catch (err) {
    errorHandler.handleError(err, "currencyHelpers/getCurrencyRates");
    throw err;
  }
}

export default {
  updateCurrencyRates,
  getCurrencyRates
};
