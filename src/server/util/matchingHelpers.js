// Imports
import refugeeHelpers from "../util/refugeeHelpers.js";
require('dotenv').config();

// config vars
const totalEurDonatedWeight = Number(process.env.BENEFICIARY_MATCHING_TOTAL_EUR_DONATED_WEIGHT);
const recentEurDonatedWeight = Number(process.env.BENEFICIARY_MATCHING_RECENT_EUR_DONATED_WEIGHT);
const baselineScore = Number(process.env.BENEFICIARY_MATCHING_BASELINE_SCORE);

const precision = 0.001 // float precision

function getTotalWeight(idToWeight) {
  // see: https://stackoverflow.com/questions/8435183/generate-a-weighted-random-number
  let totalWeight = 0;
  for (const id in idToWeight) {
    if (idToWeight.hasOwnProperty(id)) {
      totalWeight += idToWeight[id];
    }
  }
  return totalWeight;
}

function weightedRandSelection(idToWeight) {
  // randomly select element: {element: weight, ...}. NOTE: weights must sum to 1
  // see: https://stackoverflow.com/questions/8435183/generate-a-weighted-random-number
  let sum = 0;
  // check if weights sum to 1
  const totalWeight = getTotalWeight(idToWeight);
  if (Math.abs(totalWeight - 1) > precision) {
    console.log(`WARNING (matchingHelpers/weightedRandSelection): totalWeight does not sum to 1! totalWeight: ${totalWeight.toFixed(5)}`);
  }
  // random selection
  const r = Math.random();
  for (const id in idToWeight) {
    if (idToWeight.hasOwnProperty(id)) {
      sum += idToWeight[id];
      if (r <= sum) return id;
    }
  }
  console.log("WARNING (matchingHelpers/weightedRandSelection): reached end of loop; returning first key");
  return Object.keys(idToWeight)[0];
}

function shuffle(array) {
  let shuffled = array.concat();
  shuffled.sort(() => Math.random() - 0.5);
  return shuffled;
}

function inverseTransform(x) {
  return 1.0 / (1.0 + x);
}

function scoringFunctionForDonationMetric(beneficiaryObj, donationMetric) {
  // scoring function: lower donation value (metric) --> higher score
  return inverseTransform(beneficiaryObj[donationMetric]);
}

function getOverallScoreForBeneficiary(beneficiaryObj) {
  const overallScore = baselineScore
    + totalEurDonatedWeight * scoringFunctionForDonationMetric(beneficiaryObj, "totalEurDonated")
    + recentEurDonatedWeight * scoringFunctionForDonationMetric(beneficiaryObj, "eurDonatedLastThirtyDays");
  return overallScore;
}

function normalizeScores(beneficiaryScores) {
  // make scores sum to 1, return new score assignments
  let beneficiaryScoresNormalized = beneficiaryScores;
  const totalScore = getTotalWeight(beneficiaryScores);
  for (const beneficiaryId in beneficiaryScores) {
    if (beneficiaryScores.hasOwnProperty(beneficiaryId)) {
      beneficiaryScoresNormalized[beneficiaryId] = beneficiaryScores[beneficiaryId] / totalScore;
    }
  }
  return beneficiaryScoresNormalized;
}

function assignScoresToBeneficiaries(beneficiaryObjs) {
  // returns {beneficiaryId: 0.1, ...} --> feed into weightedRandSelection() to pick a beneficiary
  let beneficiaryScores = {};
  // calculate overall scores (weights) for each beneficiary
  beneficiaryObjs.forEach(beneficiary => {
    beneficiaryScores[beneficiary.beneficiaryId] = getOverallScoreForBeneficiary(beneficiary);
  });
  // normalize (sum to 1)
  beneficiaryScores = normalizeScores(beneficiaryScores); 
  return beneficiaryScores;
}

function getMatchedBeneficiaryId(donatableBeneficiaries) {
  // return next family, and the new array
  const beneficiaryScores = assignScoresToBeneficiaries(donatableBeneficiaries);
  const selectedBeneficiaryId = Number(weightedRandSelection(beneficiaryScores));
  return selectedBeneficiaryId;
}

function getMatchedAndAdditionalBeneficiaries(beneficiaryObjs, numAdditionalBeneficiaries) {
  // get matched beneficiary, and N other additional beneficiaries (or all others, if numAdditionalBeneficiaries DNE)
  let additionalBeneficiaries = [];
  const donatableBeneficiaries = refugeeHelpers.getDonatableBeneficiaries(beneficiaryObjs);
  // get matched beneficiary
  const selectedBeneficiaryId = getMatchedBeneficiaryId(donatableBeneficiaries);
  const matchedBeneficiary = beneficiaryObjs.find(beneficiary => beneficiary.beneficiaryId === selectedBeneficiaryId);
  // randomly get N other additional beneficiaries
  additionalBeneficiaries = beneficiaryObjs.filter(beneficiary => beneficiary.beneficiaryId !== selectedBeneficiaryId);
  additionalBeneficiaries = shuffle(additionalBeneficiaries);
  if (numAdditionalBeneficiaries) {
    additionalBeneficiaries = additionalBeneficiaries.slice(0, numAdditionalBeneficiaries);
  }
  return {
    matchedBeneficiary: matchedBeneficiary,
    additionalBeneficiaries: additionalBeneficiaries
  };
}

export default {
  getTotalWeight,
  assignScoresToBeneficiaries,
  getMatchedAndAdditionalBeneficiaries
}
