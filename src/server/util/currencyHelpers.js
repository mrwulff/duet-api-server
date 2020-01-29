// imports
import rp from 'request-promise';
import { fx } from 'money';
import errorHandler from '../util/errorHandler.js';

// Cached currency rates
let currencyRates;

// Get currency rates in openexchangerates format
async function updateCurrencyRates() {
  try {
    const openExUri = `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPEN_EXCHANGE_APP_ID}`;
    const options = {
      uri: openExUri,
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
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging') {
      const rates = {
        "base": "USD",
        "rates": {
          "EUR": 0.903514,
        }
      }
      return rates;
    }
      
    if (!currencyRates) {
      await updateCurrencyRates();
    }
    return currencyRates;
  } catch (err) {
    errorHandler.handleError(err, "currencyHelpers/getCurrencyRates");
    throw err;
  }
}

async function convertCurrency(amt, from, to) {
  // e.g. convertCurrency(20, "EUR", "USD")
  try {
    const currencyRates = await getCurrencyRates();
    fx.rates = currencyRates.rates;
    fx.base = currencyRates.base;
    const convertedAmt = fx(amt).from(from).to(to);
    return convertedAmt;
  } catch (err) {
    errorHandler.handleError(err, "currencyHelpers/convertCurrency");
    throw err;
  }
}

export default {
  updateCurrencyRates,
  getCurrencyRates,
  convertCurrency
};
