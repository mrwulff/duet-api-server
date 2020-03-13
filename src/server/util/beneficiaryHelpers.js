// Imports
import config from "./config.js";
import errorHandler from "./errorHandler.js";
import itemHelpers from "./itemHelpers.js";
import matchingHelpers from "./matchingHelpers.js";

function sqlRowToBeneficiaryObj(row) {
  // SQL row to beneficiary object
  const beneficiaryObj = {
    beneficiaryId: Number(row.beneficiary_id),
    username: row.beneficiary_username,
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
    monthlyBudgetEur: row.monthly_budget_eur,
    totalEurRequestedThisMonth: Number(row.total_eur_requested_this_month),
    totalEurDonated: Number(row.total_eur_donated),
    totalItemsDonated: Number(row.total_items_donated),
    eurDonatedLastThirtyDays: Number(row.eur_donated_last_thirty_days),
    itemsDonatedLastThirtyDays: Number(row.items_donated_last_thirty_days),
    totalEurDonatable: Number(row.total_eur_donatable),
    totalItemsDonatable: Number(row.total_items_donatable)
  };
  return beneficiaryObj;
}

async function getBeneficiaryIdFromPasscode(passcode) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT beneficiary_id from beneficiaries WHERE passcode = ?",
      [passcode]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0].beneficiary_id;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getBeneficiaryIdFromPasscode");
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

async function getBeneficiaryById(beneficiaryId, {withNeeds=true}={}) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM beneficiaries_view WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    if (results.length === 0) {
      return null;
    }
    const beneficiaryObj = sqlRowToBeneficiaryObj(results[0]);
    if (withNeeds) {
      // get itemObjs for this beneficiary
      const beneficiaryNeeds = await getItemObjsFromBeneficiaryId(beneficiaryId);
      beneficiaryObj.needs = beneficiaryNeeds;
    }
    return beneficiaryObj;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getBeneficiaryById");
    throw err;
  }
}

async function getBeneficiaryByUsername(username, {withNeeds=true}={}) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT * FROM beneficiaries_view WHERE beneficiary_username = ?",
      [username]
    );
    if (results.length === 0) {
      return null;
    }
    const beneficiaryObj = sqlRowToBeneficiaryObj(results[0]);
    if (withNeeds) {
      // get itemObjs for this beneficiary
      const beneficiaryNeeds = await getItemObjsFromBeneficiaryId(beneficiaryObj.beneficiaryId);
      beneficiaryObj.needs = beneficiaryNeeds;
    }
    return beneficiaryObj;
  } catch (err) {
    errorHandler.handleError(err, "beneficiaryHelpers/getBeneficiaryByUsername");
    throw err;
  }
}

async function getAllBeneficiaries({withNeeds=true}={}) {
  try {
    const conn = await config.dbInitConnectPromise();
    // without needs
    if (!withNeeds) {
      const [rows, fields] = await conn.query(
        "SELECT * FROM beneficiaries_view"
      );
      return rows.map(sqlRowToBeneficiaryObj);
    }
    // with needs
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
    errorHandler.handleError(err, "beneficiaryHelpers/getAllBeneficiaries");
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
      "AND YEAR(requested_timestamp) = YEAR(CURRENT_TIMESTAMP) " +
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

export default {
  // Data model
  sqlRowToBeneficiaryObj,

  // Identification
  getBeneficiaryIdFromPasscode,

  // Retrieval
  getBeneficiaryById,
  getBeneficiaryByUsername,
  getAllBeneficiaries,

  // Budgeting
  getMonthlyEurBudget,
  getTotalEurRequestedThisMonth
};
