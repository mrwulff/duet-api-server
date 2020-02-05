// Imports
import config from '../util/config.js';
import errorHandler from '../util/errorHandler.js';

// ---------- ITEMS ---------- //

async function getNumItemsDonated() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT count(*) AS num_items_donated FROM items WHERE donation_id IS NOT NULL
    `);
    return results[0].num_items_donated;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getNumItemsDonated");
    throw err;
  }
}

async function getNumItemsPickedUp() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT count(*) AS num_items_picked_up FROM items WHERE status='PICKED_UP'
    `);
    return results[0].num_items_picked_up;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getNumItemsPickedUp");
    throw err;
  }
}

// ---------- BENEFICIARIES ---------- //

async function getTotalNumBeneficiaries() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT count(*) AS num_beneficiaries FROM beneficiaries
    `);
    return results[0].num_beneficiaries;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getTotalNumBeneficiaries");
    throw err;
  }
}

// ---------- DONATIONS ---------- //

async function getNumDonations() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT count(*) AS num_donations FROM donations
    `);
    return results[0].num_donations;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getNumDonations");
    throw err;
  }
}

async function getNumUniqueDonors() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT count(*) AS num_unique_donors FROM donors_view
    `);
    return results[0].num_unique_donors;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getNumUniqueDonors");
    throw err;
  }
}

async function getTotalUsdDonated() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT sum(donation_amt_usd) AS total_usd_donated FROM donations
    `);
    const totalUsdDonated = Number(results[0].total_usd_donated);
    return totalUsdDonated;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getTotalUsdDonated");
    throw err;
  }
}

async function getTotalEurDonated() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT sum(price_euros) as total_eur_donated FROM items_view WHERE donation_id IS NOT NULL
    `);
    const totalEurDonated = Number(results[0].total_eur_donated)
    return totalEurDonated;
  } catch (err) {
    errorHandler.handleError(err, "metrics/getTotalEurDonated");
    throw err;
  }
}

export default {
  // items
  getNumItemsDonated,
  getNumItemsPickedUp,

  // beneficiaries
  getTotalNumBeneficiaries,

  // donations
  getNumDonations,
  getNumUniqueDonors,
  getTotalUsdDonated,
  getTotalEurDonated
};
