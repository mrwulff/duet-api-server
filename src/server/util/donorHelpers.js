import sqlHelpers from '../util/sqlHelpers.js';

function getFrontEndDonorObj(row) {
  let donationObj = {
    donorEmail: row.donor_email,
    donorFirst: row.donor_fname,
    donorLast: row.donor_lname,
    donorCountry: row.donor_country
  }
  return donationObj;
}

async function donorEmailHasDonated(donorEmail) {
  // return true if donor has donated before
  const result = sqlHelpers.getDonorInfo(donorEmail);
  return (!!result); // return true for non-null result
}

async function donorEmailHasHadPickup(donorEmail) {
  // return true if donor has had an item be PICKED_UP
  const result = sqlHelpers.getDonorInfo(donorEmail);
  const numPickups = result.total_items_picked_up;
  return (numPickups > 0);
}

export default {
  getFrontEndDonorObj,
  donorEmailHasDonated,
  donorEmailHasHadPickup
}