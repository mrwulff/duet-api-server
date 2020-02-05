// Imports
import errorHandler from "../util/errorHandler.js";
import metricsHelpers from "../util/metricsHelpers.js";

async function getMetrics(req, res) {
  try {
    
    // items metrics
    const numItemsDonated = await metricsHelpers.getNumItemsDonated();
    const numItemsPickedUp = await metricsHelpers.getNumItemsPickedUp();
    // beneficiaries metrics
    const totalNumBeneficiaries = await metricsHelpers.getTotalNumBeneficiaries();
    // donation metrics
    const numDonations = await metricsHelpers.getNumDonations();
    const numUniqueDonors = await metricsHelpers.getNumUniqueDonors();
    const totalEurDonated = await metricsHelpers.getTotalEurDonated();
    const totalUsdDonated = await metricsHelpers.getTotalUsdDonated();
    // return payload
    return res.json({
      numItemsDonated,
      numItemsPickedUp,
      totalNumBeneficiaries,
      numDonations,
      numUniqueDonors,
      totalUsdDonated,
      totalEurDonated
    });
  } catch (err) {
    errorHandler.handleError(err, "metrics/getMetrics");
    return res.status(500).send();
  }
}

export default {
  getMetrics
};
