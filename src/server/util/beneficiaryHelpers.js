// Imports
import config from "./config.js";
import errorHandler from "./errorHandler.js";
import itemHelpers from "./itemHelpers.js";
import matchingHelpers from "./matchingHelpers.js";

function sqlRowToBeneficiaryObj(row) {
  // SQL row to beneficiary object
  const beneficiaryObj = {
    beneficiaryId: Number(row.beneficiary_id),
    firstName: row.beneficiary_first,
    lastName: row.beneficiary_last,
    story: row.story,
    language: row.language,
    fbPsid: row.fb_psid,
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

async function getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM beneficiaries_view WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    if (results.length === 0) {
      return null;
    }
    return sqlRowToBeneficiaryObj(results[0]);
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getBeneficiaryObjWithoutNeedsFromBeneficiaryId");
    throw err;
  }
}

async function getItemObjsFromBeneficiaryId(beneficiaryId) {
  // Get item needs for 1 beneficiary
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM items_view WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    return results.map(itemHelpers.sqlRowToItemObj);
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getItemObjsFromBeneficiaryId");
    throw err;
  }
}

async function getBeneficiaryObjWithNeedsFromBeneficiaryId(beneficiaryId) {
  try {
    // Get beneficiary obj
    const beneficiaryObj = await getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId);
    if (!beneficiaryObj) {
      return null;
    }
    // Get beneficiary needs in SQL format
    const beneficiaryNeeds = await getItemObjsFromBeneficiaryId(beneficiaryId);
    beneficiaryObj.needs = beneficiaryNeeds;
    return beneficiaryObj;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getBeneficiaryObjWithNeedsFromBeneficiaryId");
    throw err;
  }
}

async function getAllBeneficiaryObjsWithNeeds() {
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT * FROM beneficiaries_and_items_view"
    );
    let currentBeneficiaryId = -1;
    let beneficiaryObj;
    const allBeneficiaryObjs = [];
    // Convert to format that the front-end code expects
    rows.forEach(row => {
      // New beneficiary
      if (currentBeneficiaryId !== row.beneficiary_id) {
        // Done with previous beneficiaryObj
        if (beneficiaryObj) {
          allBeneficiaryObjs.push(beneficiaryObj);
        }
        // Create beneficiaryObj with first need
        beneficiaryObj = sqlRowToBeneficiaryObj(row);
        if (row.item_id) {
          beneficiaryObj.needs = [itemHelpers.sqlRowToItemObj(row)];
        } else {
          beneficiaryObj.needs = [];
        }
      }
      // Continue current beneficiary
      else {
        // Append next item need
        beneficiaryObj.needs.push(itemHelpers.sqlRowToItemObj(row));
      }
      // Move to next row (but possibly still the same beneficiaryId)
      currentBeneficiaryId = row.beneficiary_id;
    });
    // Push last beneficiaryObj
    allBeneficiaryObjs.push(beneficiaryObj);
    return allBeneficiaryObjs;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getAllBeneficiaryObjsWithNeeds");
    throw err;
  }
}

async function getMonthlyEurBudget(beneficiaryId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT monthly_budget_eur FROM beneficiaries " +
      "WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    if (rows.length === 0) {
      console.log(`beneficiaryHelpers.getMonthlyEurBudget(): beneficiaryId not found: ${beneficiaryId}`);
      return null;
    }
    return rows[0].monthly_budget_eur;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getMonthlyEurBudget");
    throw err;
  }
}

async function getTotalEurRequestedThisMonth(beneficiaryId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT SUM(price_euros) as total_eur_requested_this_month " +
      "FROM beneficiaries_and_items_view " +
      "WHERE MONTH(requested_timestamp) = MONTH(CURRENT_TIMESTAMP) " +
      "AND status != 'GRAVEYARD' " +
      "AND beneficiary_id = ?",
      [beneficiaryId]
    );
    if (rows.length === 0) {
      return 0;
    }
    return Number(rows[0].total_eur_requested_this_month);
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getTotalEurRequestedThisMonth");
    throw err;
  }
}

async function getBeneficiaryScores() {
  const allBeneficiaryObjs = await getAllBeneficiaryObjsWithNeeds();
  const donatableBeneficiaries = matchingHelpers.filterDonatableBeneficiaries(allBeneficiaryObjs);
  const beneficiaryScores = matchingHelpers.assignScoresToBeneficiaries(donatableBeneficiaries);
  return beneficiaryScores;
}

async function getMatchedAndAdditionalBeneficiaries(numAdditionalBeneficiaries) {
  // get matched beneficiary, and N other additional beneficiaries
  const allBeneficiaryObjs = await getAllBeneficiaryObjsWithNeeds();
  const matchedAndAdditionalBeneficiaries = matchingHelpers.getMatchedAndAdditionalBeneficiaries(allBeneficiaryObjs, numAdditionalBeneficiaries);
  return matchedAndAdditionalBeneficiaries;
}

export default {
  // Data model
  sqlRowToBeneficiaryObj,
  getBeneficiaryObjWithoutNeedsFromBeneficiaryId,

  // Needs
  getBeneficiaryObjWithNeedsFromBeneficiaryId,
  getAllBeneficiaryObjsWithNeeds,

  // Matching
  getBeneficiaryScores,
  getMatchedAndAdditionalBeneficiaries,

  // Budgeting
  getMonthlyEurBudget,
  getTotalEurRequestedThisMonth
}
