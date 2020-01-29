import config from '../util/config.js';
import errorHandler from "../util/errorHandler.js";

function capitalizeAndTrimName(nameStr) {
  if (!nameStr) {
    return null;
  }
  const capitalized = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
  return capitalized.trim();
}

function sqlRowToDonorObj(row) {
  const donationObj = {
    donorEmail: row.donor_email,
    donorFirst: capitalizeAndTrimName(row.donor_fname),
    donorLast: capitalizeAndTrimName(row.donor_lname),
    donorCountry: row.donor_country
  }
  return donationObj;
}

async function getAllDonorEmails() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query("SELECT donor_email from donors_view");
    return results.map(row => row.donor_email);
  } catch (err) {
    errorHandler.handleError(err, "donorHelpers/getAllDonorEmails");
    throw err;
  }
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
  capitalizeAndTrimName,
  sqlRowToDonorObj,
  getAllDonorEmails,
  getDonorObjFromDonorEmail,
  donorEmailExists,
};
