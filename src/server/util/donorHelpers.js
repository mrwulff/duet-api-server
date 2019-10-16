import sqlHelpers from '../util/sqlHelpers.js';

function sqlRowToDonorObj(row) {
  const donationObj = {
    donorEmail: row.donor_email,
    donorFirst: row.donor_fname,
    donorLast: row.donor_lname,
    donorCountry: row.donor_country
  }
  return donationObj;
}

async function donorEmailHasDonated(donorEmail) {
  // return true if donor has donated before
  const result = await sqlHelpers.getDonorRowFromDonorEmail(donorEmail);
  return (!!result); // return true for non-null result
}

async function donorEmailHasHadPickup(donorEmail) {
  // return true if donor has had an item be PICKED_UP
  const result = await sqlHelpers.getDonorRowFromDonorEmail(donorEmail);
  const numPickups = result.total_items_picked_up;
  return (numPickups > 0);
}

export default {
  sqlRowToDonorObj,
  donorEmailHasDonated,
  donorEmailHasHadPickup
}