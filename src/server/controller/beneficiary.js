// Imports
import beneficiaryHelpers from "../util/beneficiaryHelpers.js";
import errorHandler from "../util/errorHandler.js";

// Get needs for either 1 or all beneficiaries
async function getBeneficiaryNeeds(req, res) {
  try {
    // Specify beneficiary ID --> get info for just that refugee
    if (req.query.beneficiary_id) {
      const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithNeedsFromBeneficiaryId(req.query.beneficiary_id);
      if (!beneficiaryObj) {
        return res.json({
          msg: "Beneficiary does not exist"
        });
      }
      return res.json(beneficiaryObj);
    }
    // No beneficiary ID specified --> get all beneficiary info and needs
    const allBeneficiaryObjs = await beneficiaryHelpers.getAllBeneficiaryObjsWithNeeds();
    if (!allBeneficiaryObjs) {
      return res.json({
        msg: "No beneficiaries exist"
      });
    }
    return res.json(allBeneficiaryObjs);
  } catch (err) {
    errorHandler.handleError(err, "refugee/getBeneficiaryNeeds");
    return res.status(500).send();
  }
}

// Get 1 matched beneficiary, and N other beneficiaries (for carousel)
async function getBeneficiaryMatch(req, res) {
  try {
    // note: if req.query.numAdditionalBeneficiaries is undefined, then this will return all additional beneficiaries
    const matchedAndAdditionalBeneficiaries = await beneficiaryHelpers.getMatchedAndAdditionalBeneficiaries(req.query.numAdditionalBeneficiaries);
    return res.json(matchedAndAdditionalBeneficiaries);
  } catch (err) {
    errorHandler.handleError(err, "refugee/getBeneficiaryMatch");
    return res.status(500).send();
  }
}

async function getBeneficiaryScores(req, res) {
  try {
    const beneficiaryScores = await beneficiaryHelpers.getBeneficiaryScores();
    return res.json(beneficiaryScores);
  } catch (err) {
    errorHandler.handleError(err, "refugee/getBeneficiaryScores");
    return res.status(500).send();
  }
}

export default { 
  getBeneficiaryNeeds,
  getBeneficiaryMatch,
  getBeneficiaryScores
};
