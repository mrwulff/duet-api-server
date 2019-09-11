// Imports
import sqlHelpers from "../util/sqlHelpers.js";
import refugeeHelpers from "../util/refugeeHelpers.js"
import { getMaxListeners } from "cluster";

// Get needs for either 1 or all beneficiaries
async function getNeeds(req, res) {
  // Specify beneficiary ID --> get info for just that refugee
  if (req.query.beneficiary_id) {
    let beneficiaryObj = await refugeeHelpers.getSingleBeneficiaryInfoAndNeeds(req.query.beneficiary_id);
    if (!beneficiaryObj) {
      return res.json({
        msg: "Beneficiary does not exist"
      });
    }
    return res.json(beneficiaryObj);
  }
  // No beneficiary ID specified --> get all beneficiary info and needs
  let allBeneficiaryObjs = await refugeeHelpers.getAllBeneficiariesInfoAndNeeds();
  if (!allBeneficiaryObjs) {
    return res.json({
      msg: "No beneficiaries exist"
    });
  }
  return res.json(allBeneficiaryObjs);
}

export default { 
  getNeeds
};
