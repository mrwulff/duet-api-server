// Imports
import beneficiaryHelpers from "../util/beneficiaryHelpers.js";
import matchingHelpers from "../util/matchingHelpers.js";
import fbHelpers from "../util/fbHelpers.js";
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
    errorHandler.handleError(err, "beneficiary/getBeneficiaryNeeds");
    return res.status(500).send();
  }
}

// Get 1 matched beneficiary, and N other beneficiaries (for carousel)
async function getBeneficiaryMatch(req, res) {
  try {
    // note: if req.query.numAdditionalBeneficiaries is undefined, then this will return all additional beneficiaries
    const matchedAndAdditionalBeneficiaries = await beneficiaryHelpers.getMatchedAndAdditionalBeneficiaries(req.query.numAdditionalBeneficiaries);
    matchingHelpers.logBeneficiaryMatchInDB(matchedAndAdditionalBeneficiaries.matchedBeneficiary.beneficiaryId);
    return res.json(matchedAndAdditionalBeneficiaries);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/getBeneficiaryMatch");
    return res.status(500).send();
  }
}

async function getBeneficiaryScores(req, res) {
  try {
    const beneficiaryScores = await beneficiaryHelpers.getBeneficiaryScores();
    return res.json(beneficiaryScores);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/getBeneficiaryScores");
    return res.status(500).send();
  }
}

async function makeFBAnnouncementToVisibleBeneficiaries(req, res) {
  try {
    const { messageTemplates } = req.body;
    // check to make sure all languages are accounted for
    if (!messageTemplates.en || !messageTemplates.fa || !messageTemplates.ar) {
      console.log(`Tried to make FB announcement, but not all languages were included! messageTemplates: ${JSON.stringify(messageTemplates)}`);
      return res.sendStatus(400);
    }
    await fbHelpers.sendFBMessageToAllVisibleBeneficiaries(messageTemplates);
    console.log(`Successfully made FB announcement using messageTemplates: ${JSON.stringify(messageTemplates)}`);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/makeFBAnnouncementToVisibleBeneficiaries");
    return res.sendStatus(500);
  }
}

export default { 
  getBeneficiaryNeeds,
  getBeneficiaryMatch,
  getBeneficiaryScores,
  makeFBAnnouncementToVisibleBeneficiaries
};
