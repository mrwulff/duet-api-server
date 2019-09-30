// Imports
import itemHelpers from "../util/itemHelpers.js";
import sqlHelpers from "../util/sqlHelpers.js";
import matchingHelpers from "../util/matchingHelpers.js";

function getFrontEndBeneficiaryObj(row) {
  // SQL row to beneficiary object
  let beneficiaryObj = {
    beneficiaryId: Number(row.beneficiary_id),
    firstName: row.beneficiary_first,
    lastName: row.beneficiary_last,
    story: row.story,
    numFamilyMembers: Number(row.num_family_members),
    originCity: row.origin_city,
    originCountry: row.origin_country,
    currentCity: row.current_city,
    currentCountry: row.current_country,
    familyImage: row.family_image_url,
    hasFamilyPhoto: Number(row.has_family_photo),
    visible: Number(row.beneficiary_is_visible),
    totalEurDonated: Number(row.total_eur_donated),
    totalItemsDonated: Number(row.total_items_donated),
    eurDonatedLastThirtyDays: Number(row.eur_donated_last_thirty_days),
    itemsDonatedLastThirtyDays: Number(row.items_donated_last_thirty_days),
    totalEurDonatable: Number(row.total_eur_donatable),
    totalItemsDonatable: Number(row.total_items_donatable)
  };
  return beneficiaryObj;
}

function getActiveBeneficiaries(beneficiaryObjs) {
  return beneficiaryObjs.filter(
    beneficiary => (beneficiary.totalItemsDonatable > 0 || beneficiary.totalItemsDonated > 0)
  );
}

function getDonatableBeneficiaries(beneficiaryObjs) {
  return beneficiaryObjs.filter(beneficiary => beneficiary.totalItemsDonatable > 0);
}

async function getSingleBeneficiaryInfoAndNeeds(beneficiaryId) {
  // Get beneficiary info
  let row = await sqlHelpers.getBeneficiaryInfo(beneficiaryId);
  if (!row) {
    return null;
  }
  // Convert beneficiary object fields
  let beneficiaryObj = getFrontEndBeneficiaryObj(row);
  // Get beneficiary needs in SQL format
  let beneficiaryNeeds = await sqlHelpers.getBeneficiaryNeeds(beneficiaryId);
  if (beneficiaryNeeds.length === 0) {
    console.log("Beneficiary has no item needs!");
  }
  let needs = [];
  // Convert to format that the front-end code expects
  beneficiaryNeeds.forEach(row => {
    needs.push(itemHelpers.getFrontEndItemObj(row));
  });
  beneficiaryObj.needs = needs;
  return beneficiaryObj;
}

function getBeneficiaryObjsFromSQLRows(rows) {
  let currentBeneficiaryId = -1;
  let beneficiaryObj;
  let allBeneficiaryObjs = [];
  // Convert to format that the front-end code expects
  rows.forEach(row => {
    // New beneficiary
    if (currentBeneficiaryId !== row.beneficiary_id) {
      // Done with previous beneficiaryObj
      if (beneficiaryObj) {
        allBeneficiaryObjs.push(beneficiaryObj);
      }
      // Create beneficiaryObj with first need
      beneficiaryObj = getFrontEndBeneficiaryObj(row);
      if (row.item_id) {
        beneficiaryObj.needs = [itemHelpers.getFrontEndItemObj(row)];
      } else {
        beneficiaryObj.needs = [];
      }
    }
    // Continue current beneficiary
    else {
      // Append next item need
      beneficiaryObj.needs.push(itemHelpers.getFrontEndItemObj(row));
    }
    // Move to next row (but possibly still the same beneficiaryId)
    currentBeneficiaryId = row.beneficiary_id;
  });
  // Push last beneficiaryObj
  allBeneficiaryObjs.push(beneficiaryObj);
  return allBeneficiaryObjs;
}

async function getAllBeneficiariesInfoAndNeeds() {
  let rows = await sqlHelpers.getAllBeneficiaryInfoAndNeeds(); // get beneficiary info in SQL format
  if (rows.length === 0) {
    console.log("No beneficiaries");
    return null;
  }
  const allBeneficiaryObjs = getBeneficiaryObjsFromSQLRows(rows);
  return allBeneficiaryObjs;
}

async function getMatchedAndAdditionalBeneficiaries(numAdditionalBeneficiaries) {
  // get matched beneficiary, and N other additional beneficiaries
  let rows = await sqlHelpers.getAllBeneficiaryInfoAndNeeds(); // get beneficiary info in SQL format
  if (rows.length === 0) {
    console.log("No beneficiaries");
    return null;
  }
  const allBeneficiaryObjs = getBeneficiaryObjsFromSQLRows(rows);
  const matchedAndAdditionalBeneficiaries = matchingHelpers.getMatchedAndAdditionalBeneficiaries(allBeneficiaryObjs, numAdditionalBeneficiaries);
  return matchedAndAdditionalBeneficiaries;
}

export default {
  getActiveBeneficiaries,
  getDonatableBeneficiaries,
  getSingleBeneficiaryInfoAndNeeds,
  getAllBeneficiariesInfoAndNeeds,
  getMatchedAndAdditionalBeneficiaries
}
