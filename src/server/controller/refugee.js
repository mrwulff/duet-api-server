// Imports
import sqlHelpers from "../util/sqlHelpers.js";
import refugeeHelpers from "../util/refugeeHelpers.js";
import errorHandler from "../util/errorHandler.js";
import { getMaxListeners } from "cluster";

// Get needs for either 1 or all beneficiaries
async function getNeeds(req, res) {
  try {
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
  } catch (err) {
    errorHandler.handleError(err, "refugee/getNeeds");
    return res.status(500).send();
  }
}

// Get 1 matched beneficiary, and N other beneficiaries (for carousel)
async function getMatch(req, res) {
  try {
    // note: if req.query.numAdditionalBeneficiaries is undefined, then this will return all additional beneficiaries
    const matchedAndAdditionalBeneficiaries = await refugeeHelpers.getMatchedAndAdditionalBeneficiaries(req.query.numAdditionalBeneficiaries);
    return res.json(matchedAndAdditionalBeneficiaries);
  } catch (err) {
    errorHandler.handleError(err, "refugee/getMatch");
    return res.status(500).send();
  }
}

export default { 
  getNeeds,
  getMatch
};
