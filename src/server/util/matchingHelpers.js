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

function inverseRankScoreLinear(rankIndex, N) {
  // Linear scorer: rank 0 gets a score of 1; rank (n-1) gets a score of 0
  return 1.0 - (1.0 / (N - 1)) * rankIndex;
}

function inverseRankScorePower(rankIndex, N) {
  // Power-law scorer: rank 0 gets a score of 1; others get 1 / (rankIndex + 1)
  return 1.0 / (rankIndex + 1);
}

function getMinDonatableItemPrice(beneficiaryObj) {
  // get beneficiary's minimum donatable item price
  const donatableItems = beneficiaryObj.needs.filter(item => item.status === 'VERIFIED');
  const itemPrices = donatableItems.map(item => item.price)
  const minPrice = Math.min(...itemPrices);
  return minPrice;
}

function getRawMatchingScoresForBeneficiary(beneficiaryId, scoreDicts, scoreWeights) {
  // get raw (unnormalized) matching scores for beneficiary
  const { totalEurDonatedScoreDict, recentEurDonatedScoreDict, minItemPriceScoreDict } = scoreDicts;
  const totalEurDonatedScore = totalEurDonatedScoreDict[beneficiaryId];
  const recentEurDonatedScore = recentEurDonatedScoreDict[beneficiaryId];
  const minItemPriceScore = minItemPriceScoreDict[beneficiaryId];
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

function getScoreDictForMetric(beneficiariesDict, metric) {
  // given: beneficiariesDict (id --> beneficiary), metric name (string)
  // return: id --> score
  const scoreDict = {};
  const beneficiaryIds = Object.keys(beneficiariesDict);
  // sort beneficiaryIds according to metric
  beneficiaryIds.sort((a, b) => { return beneficiariesDict[a][metric] - beneficiariesDict[b][metric] });
  // calculate score according to rank
  let rankIndex = 0;
  for (let i = 0; i < beneficiaryIds.length; i++) {
    // increment rankIndex only if current beneficiary's metric is strictly greater than previous beneficiary's metric
    // this way, a tie results in the same component score for 2 beneficiaries
    if (i > 0 && beneficiariesDict[beneficiaryIds[i]][metric] > beneficiariesDict[beneficiaryIds[i-1]][metric]) {
      rankIndex += 1;
    }
    scoreDict[beneficiaryIds[i]] = inverseRankScorePower(rankIndex, beneficiaryIds.length);
  }
  return scoreDict;
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

function getMatchingScoreDictFromBeneficiaryObjs(beneficiaries, scoreWeights) {
  // returns {beneficiaryId: 0.1, ...} --> feed into weightedRandSelection() to pick a beneficiary
  let normalizedScoreDict = {};
  let rawScoreDict = {};
  beneficiaries = beneficiaries.map(beneficiary => {
    beneficiary.minItemPrice = getMinDonatableItemPrice(beneficiary);
    return beneficiary;
  });

  // create beneficiary dict: id --> beneficiary object
  let beneficiariesDict = {};
  beneficiaries.forEach(beneficiary => {
    beneficiariesDict[beneficiary.beneficiaryId] = beneficiary;
  });
  
  // get each beneficiary's score for each metric
  const totalEurDonatedScoreDict = getScoreDictForMetric(beneficiariesDict, "totalEurDonated");
  const recentEurDonatedScoreDict = getScoreDictForMetric(beneficiariesDict, "eurDonatedLastThirtyDays");
  const minItemPriceScoreDict = getScoreDictForMetric(beneficiariesDict, "minItemPrice");
  const scoreDicts = { totalEurDonatedScoreDict, recentEurDonatedScoreDict, minItemPriceScoreDict };

  // get overall score for each beneficiary
  beneficiaries.forEach(beneficiary => {
    const rawScores = getRawMatchingScoresForBeneficiary(beneficiary.beneficiaryId, scoreDicts, scoreWeights);
    rawScoreDict[beneficiary.beneficiaryId] = rawScores;
    normalizedScoreDict[beneficiary.beneficiaryId] = rawScores.overallScore;
  });

  // normalize overall scores (sum to 1)
  normalizedScoreDict = normalizeScores(normalizedScoreDict); 
  return { 
    normalizedScores: normalizedScoreDict,
    rawScores: rawScoreDict
  };
}

// ---------- SAMPLING/FILTERING UTILS ---------- //

function sampleFromListAtRandom(list) {
  // sample an element from list at random
  if (!list) {
    return null;
  }
  if (list.length === 1) {
    return list[0]
  }
  return list[Math.floor(Math.random() * list.length)];
}

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

// ---------- BENEFICIARY MATCHING ---------- //

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

// ---------- ITEM SEARCH ---------- //

async function sampleItemWithFairness(items) {
  // get an item from "items" using beneficiary scoring algorithm
  try {
    // get dict of beneficiaryId --> list of items
    let beneficiaryToItemsDict = {};
    items.forEach(item => {
      if (beneficiaryToItemsDict.hasOwnProperty(item.beneficiaryId)) {
        beneficiaryToItemsDict[item.beneficiaryId].push(item);
      } else {
        beneficiaryToItemsDict[item.beneficiaryId] = [item];
      }
    });
    // get normalized matching scores of beneficiaries associated with "items"
    const { normalizedScores } = await getBeneficiaryScores(); // all scores
    console.log(`matchingHelpers/sampleItemWithFairness: sampling from ${Object.keys(beneficiaryToItemsDict).length} of ${Object.keys(normalizedScores).length} beneficiaries...`);
    let itemsBeneficiaryScores = {}; // scores of beneficiaries associated with "items"
    for (const beneficiaryId in beneficiaryToItemsDict) {
      if (beneficiaryToItemsDict.hasOwnProperty(beneficiaryId) && normalizedScores.hasOwnProperty(beneficiaryId)) {
        itemsBeneficiaryScores[beneficiaryId] = normalizedScores[beneficiaryId];
      }
    }
    itemsBeneficiaryScores = normalizeScores(itemsBeneficiaryScores);
    // select a beneficiary using normalized scores
    const selectedBeneficiaryId = weightedRandSelection(itemsBeneficiaryScores);
    // select an item from this beneficiary at random
    const selectedBeneficiaryItems = beneficiaryToItemsDict[selectedBeneficiaryId];
    const selectedItem = sampleFromListAtRandom(selectedBeneficiaryItems);
    return selectedItem;
  } catch (err) {
    errorHandler.handleError(err, "matchingHelpers/itemSelectionWithFairness");
    throw err;
  }
}

export default {
  // scoring utils
  getTotalWeight,

  // sampling
  sampleFromListAtRandom,

  // matching
  getBeneficiaryScores,
  getMatchedAndAdditionalBeneficiaries,

  // item search
  sampleItemWithFairness,

  // logging
  logBeneficiaryMatchInDB,
};
