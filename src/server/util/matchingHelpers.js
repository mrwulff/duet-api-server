// Imports
import config from '../util/config.js';
import jsUtils from '../util/jsUtils.js';
import beneficiaryHelpers from '../util/beneficiaryHelpers.js';
import errorHandler from '../util/errorHandler.js';

// config vars
const baselineScore = Number(process.env.BENEFICIARY_MATCHING_BASELINE_SCORE);
const totalEurDonatedWeight = Number(process.env.BENEFICIARY_MATCHING_TOTAL_EUR_DONATED_WEIGHT);
const recentEurDonatedWeight = Number(process.env.BENEFICIARY_MATCHING_RECENT_EUR_DONATED_WEIGHT);
const minItemPriceWeight = Number(process.env.BENEFICIARY_MATCHING_MIN_ITEM_PRICE_WEIGHT);

const precision = 0.001 // float precision

// ---------- SCORING UTILS ---------- //

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

function inverseTransform(x) {
  // Inverse transform: lower metric -> higher score (between 0-1)
  return 1.0 / (1.0 + x);
}

function scoringFunctionForDonationMetric(beneficiaryObj, donationMetric) {
  // scoring function: lower donation value (metric) --> higher score
  return inverseTransform(beneficiaryObj[donationMetric]);
}

function getMinDonatableItemPrice(beneficiaryObj) {
  // get beneficiary's minimum donatable item price
  const donatableItems = beneficiaryObj.needs.filter(item => item.status === 'VERIFIED');
  const itemPrices = donatableItems.map(item => item.price)
  const minPrice = Math.min(...itemPrices);
  return minPrice;
}

function getMinItemPriceScore(beneficiaryObj) {
  // turn minItemPrice into a 0-1 score
  return inverseTransform(getMinDonatableItemPrice(beneficiaryObj));
}

function getRawMatchingScoresForBeneficiary(beneficiaryObj, scoreWeights) {
  // get raw (unnormalized) matching scores for beneficiary
  const totalEurDonatedScore = scoringFunctionForDonationMetric(beneficiaryObj, "totalEurDonated");
  const recentEurDonatedScore = scoringFunctionForDonationMetric(beneficiaryObj, "eurDonatedLastThirtyDays");
  const minItemPriceScore = getMinItemPriceScore(beneficiaryObj);
  let overallScore;
  if (scoreWeights) {
    // use custom score weights
    const { baselineScore, totalEurDonatedWeight, recentEurDonatedWeight, minItemPriceWeight } = scoreWeights;
    overallScore = baselineScore
      + totalEurDonatedWeight * totalEurDonatedScore +
      + recentEurDonatedWeight * recentEurDonatedScore +
      + minItemPriceWeight * minItemPriceScore;
  } else {
    // use score weights from env vars
    overallScore = baselineScore
      + totalEurDonatedWeight * totalEurDonatedScore +
      + recentEurDonatedWeight * recentEurDonatedScore +
      + minItemPriceWeight * minItemPriceScore;
  }
  return { 
    overallScore,
    baselineScore,
    totalEurDonatedScore,
    recentEurDonatedScore,
    minItemPriceScore 
  };
}

function normalizeScores(beneficiaryScores) {
  // make scores sum to 1, return new score assignments
  const beneficiaryScoresNormalized = beneficiaryScores;
  const totalScore = getTotalWeight(beneficiaryScores);
  for (const beneficiaryId in beneficiaryScores) {
    if (beneficiaryScores.hasOwnProperty(beneficiaryId)) {
      beneficiaryScoresNormalized[beneficiaryId] = beneficiaryScores[beneficiaryId] / totalScore;
    }
  }
  return beneficiaryScoresNormalized;
}

function getMatchingScoreDictFromBeneficiaryObjs(beneficiaryObjs, scoreWeights) {
  // returns {beneficiaryId: 0.1, ...} --> feed into weightedRandSelection() to pick a beneficiary
  let normalizedScoresDict = {};
  let rawScoresDict = {};
  beneficiaryObjs.forEach(beneficiary => {
    const rawScores = getRawMatchingScoresForBeneficiary(beneficiary, scoreWeights);
    normalizedScoresDict[beneficiary.beneficiaryId] = rawScores.overallScore;
    rawScoresDict[beneficiary.beneficiaryId] = rawScores;
  });
  // normalize (sum to 1)
  normalizedScoresDict = normalizeScores(normalizedScoresDict); 
  return { 
    normalizedScores: normalizedScoresDict,
    rawScores: rawScoresDict
  };
}

// ---------- SAMPLING/FILTERING UTILS ---------- //

function filterDonatableBeneficiaries(beneficiaryObjs) {
  // get visible beneficiaries with at least one donatable item
  return beneficiaryObjs.filter(beneficiary => beneficiary.totalItemsDonatable > 0 && beneficiary.visible);
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
  const shuffled = array.concat();
  shuffled.sort(() => Math.random() - 0.5);
  return shuffled;
}

// ---------- SCORING ---------- //

async function getBeneficiaryScores(scoreWeights) {
  // get normalizedScores and rawScores for all active beneficiaries
  scoreWeights = scoreWeights || { baselineScore, totalEurDonatedWeight, recentEurDonatedWeight, minItemPriceWeight };
  const allBeneficiaryObjs = await beneficiaryHelpers.getAllBeneficiaries({ withNeeds: true });
  const donatableBeneficiaries = filterDonatableBeneficiaries(allBeneficiaryObjs);
  const { normalizedScores, rawScores } = getMatchingScoreDictFromBeneficiaryObjs(donatableBeneficiaries, scoreWeights);
  return { normalizedScores, rawScores, scoreWeights };
}

// ---------- MATCHING ---------- //

function getMatchedBeneficiary(donatableBeneficiaries) {
  // return next family, and the new array
  const { normalizedScores } = getMatchingScoreDictFromBeneficiaryObjs(donatableBeneficiaries);
  const selectedBeneficiaryId = Number(weightedRandSelection(normalizedScores));
  const matchedBeneficiary = donatableBeneficiaries.find(beneficiary => beneficiary.beneficiaryId === selectedBeneficiaryId)
  return matchedBeneficiary;
}

async function getMatchedAndAdditionalBeneficiaries(numAdditionalBeneficiaries) {
  // get donatable benefiaries
  const allBeneficiaryObjs = await beneficiaryHelpers.getAllBeneficiaries({ withNeeds: true });
  const donatableBeneficiaries = filterDonatableBeneficiaries(allBeneficiaryObjs);
  // get matched beneficiary
  const matchedBeneficiary = getMatchedBeneficiary(donatableBeneficiaries);
  // randomly get N other additional beneficiaries
  let additionalBeneficiaries = donatableBeneficiaries.filter(beneficiary => beneficiary.beneficiaryId !== matchedBeneficiary.beneficiaryId);
  jsUtils.shuffleInPlace(additionalBeneficiaries);
  if (numAdditionalBeneficiaries) {
    additionalBeneficiaries = additionalBeneficiaries.slice(0, numAdditionalBeneficiaries);
  }
  return { matchedBeneficiary, additionalBeneficiaries };
}

async function logBeneficiaryMatchInDB(beneficiaryId) {
  // log a single "match" in the database
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query("INSERT INTO beneficiary_matches (beneficiary_id) VALUES (?)", [beneficiaryId]);
  } catch (err) {
    errorHandler.handleError(err, "matchingHelpers/logBeneficiaryMatchInDB");
    throw err;
  }
}

export default {
  // scoring utils
  getTotalWeight,

  // matching
  getBeneficiaryScores,
  getMatchedAndAdditionalBeneficiaries,

  // logging
  logBeneficiaryMatchInDB,
};
