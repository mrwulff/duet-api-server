import config from '../util/config.js';
import errorHandler from "../util/errorHandler.js";

function sqlRowToDonorObj(row) {
  const donationObj = {
    donorEmail: row.donor_email,
    donorFirst: row.donor_fname,
    donorLast: row.donor_lname,
    donorCountry: row.donor_country
  }
  return donationObj;
}

async function getDonorObjFromDonorEmail(donorEmail) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * from donors_view WHERE donor_email=?",
      [donorEmail]
    );
    if (results.length === 0) {
      throw new Error(`getDonorObjFromDonorEmail: donor not found for email: ${donorEmail}`);
    }
    return sqlRowToDonorObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "donorHelpers/getDonorObjFromDonorEmail");
    throw err;
  }
}

async function donorEmailExists(donorEmail) {
  // return true if donor has donated before
  try {
    await getDonorObjFromDonorEmail(donorEmail);
    return true;
  } catch (err) {
    return false;
  }
}

export default {
  sqlRowToDonorObj,
  getDonorObjFromDonorEmail,
  donorEmailExists,
}