// Imports
import itemHelpers from "../util/itemHelpers.js";
import sqlHelpers from "../util/sqlHelpers.js";

function getFrontEndBeneficiaryObj(row) {
    // SQL row to beneficiary object
    let beneficiaryObj = {
        beneficiaryId: row.beneficiary_id,
        firstName: row.first_name,
        lastName: row.last_name,
        story: row.story,
        originCity: row.origin_city,
        originCountry: row.origin_country,
        currentCity: row.current_city,
        currentCountry: row.current_country,
        familyImage: row.family_image_url,
        visible: row.visible
    };
    return beneficiaryObj;
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
    beneficiaryObj["needs"] = needs;
    return beneficiaryObj;
}


async function getAllBeneficiariesInfoAndNeeds() {
    let rows = await sqlHelpers.getAllBeneficiaryInfoAndNeeds(); // get beneficiary info in SQL format
    if (rows.length === 0) {
        console.log("No beneficiary needs");
        return null;
    }
    let currentBeneficiaryId = -1;
    let beneficiaryObj;
    let allBeneficiaryObjs = [];
    // Convert to format that the front-end code expects
    rows.forEach(row => {
        // New beneficiary
        if (currentBeneficiaryId != row.beneficiary_id) {
            // Done with previous beneficiaryObj
            if (beneficiaryObj) {
                allBeneficiaryObjs.push(beneficiaryObj);
            }
            // Create beneficiaryObj with first need
            beneficiaryObj = getFrontEndBeneficiaryObj(row);
            beneficiaryObj["needs"] = [
                itemHelpers.getFrontEndItemObj(row)
            ]
        }
        // Continue current beneficiary
        else {
            // Append next item need
            beneficiaryObj["needs"].push(itemHelpers.getFrontEndItemObj(row));
        }
        // Move to next row (but possibly still the same beneficiaryId)
        currentBeneficiaryId = row.beneficiary_id;
    });
    // Push last beneficiaryObj
    allBeneficiaryObjs.push(beneficiaryObj);
    return allBeneficiaryObjs;
}

export default {
    getSingleBeneficiaryInfoAndNeeds,
    getAllBeneficiariesInfoAndNeeds
}