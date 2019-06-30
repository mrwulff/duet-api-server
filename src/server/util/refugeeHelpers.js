// Imports
import sqlHelpers from "../util/sqlHelpers.js";

function rowToItemObj(row) {
    // SQL row to item object (matches front-end object format)
    let itemObj = {
        itemId: row.item_id,
        image: row.link,
        name: row.name,
        price: row.price_euros,
        storeId: row.store_id,
        storeName: row.store_name,
        icon: row.icon_url,
        status: row.status,
        pickupCode: row.pickup_code,
        donationTimestamp: row.donation_timestamp
    }
    return itemObj;
}

function rowToBeneficiaryObj(row) {
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
        familyImage: row.family_image_url
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
    let beneficiaryObj = rowToBeneficiaryObj(row);
    // Get beneficiary needs in SQL format
    let beneficiaryNeeds = await sqlHelpers.getBeneficiaryNeeds(beneficiaryId);
    if (beneficiaryNeeds.length === 0) {
        console.log("Beneficiary has no item needs!");
        return null;
    }
    let needs = [];
    // Convert to format that the front-end code expects
    beneficiaryNeeds.forEach(row => {
        needs.push(rowToItemObj(row));
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
            beneficiaryObj = rowToBeneficiaryObj(row);
            beneficiaryObj["needs"] = [
                rowToItemObj(row)
            ]
        }
        // Continue current beneficiary
        else {
            // Append next item need
            beneficiaryObj["needs"].push(rowToItemObj(row));
        }
        // Move to next row (but possibly still the same beneficiaryId)
        currentBeneficiaryId = row.beneficiary_id;
    });
    // Push last beneficiaryObj
    allBeneficiaryObjs.push(beneficiaryObj);
    // Return result
    return allBeneficiaryObjs;
}

export default {
    getSingleBeneficiaryInfoAndNeeds,
    getAllBeneficiariesInfoAndNeeds
}