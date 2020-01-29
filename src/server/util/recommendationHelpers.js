// Imports
require('dotenv').config();
import config from '../util/config.js';
import itemHelpers from '../util/itemHelpers.js';
import jsUtils from '../util/jsUtils.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from '../util/errorHandler.js';

// score weights
const beneficiaryScoreWeight = 1;
const categoryScoreWeight = 1;
const priceScoreWeight = 1;

// other parameters
const minPriceBuffer = 0;
const maxPriceBuffer = 10;
const numItemsToRecommend = 3;
const recommendationEmailIntervalDays = 14;

// ---------- GENERAL HELPER FUNCTIONS ---------- //

async function logRecommendationInDB(donorEmail, itemId, recommendationMedium, recommendationScore) {
  // Log recommendation in database
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(`
      INSERT INTO recommendations 
      (item_id, donor_email, recommendation_medium, recommendation_timestamp, recommendation_score) 
      VALUES (?, ?, ?, NOW(), ?)
      `,
      [itemId, donorEmail, recommendationMedium, recommendationScore]
    );
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/logRecommendationInDB");
    throw err;
  }
}

async function getDonorsBeneficiaryCounts() {
  // Get number of times each donor has donated to each beneficiary
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT
        donor_email,
        beneficiary_id,
        count(*) as num_items_donated
      FROM
        items_view
      WHERE
        donor_email is not null
      GROUP BY
        donor_email, beneficiary_id
    `);
    return results;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorBeneficiaryCounts");
    throw err;
  }
}

async function getDonorsCategoryCounts() {
  // Get number of times each donor has donated to each category
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT
        donor_email,
        category_id,
        category_name,
        count(*) as num_items_donated
      FROM
        items_view
      WHERE
        donor_email is not null
      GROUP BY
        donor_email, category_id
    `);
    return results;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorCategoryCounts");
    throw err;
  }
}

async function getDonorsPriceMetrics() {
  // Get past donors' price ranges
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT
        donor_email,
        MIN(price_euros) as min_item_price,
        MAX(price_euros) as max_item_price,
        AVG(price_euros) as mean_item_price
      FROM items_view
      WHERE donor_email IS NOT NULL
      GROUP BY donor_email
      `);
    if (!results.length) {
      return null;
    }
    return results;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsPriceMetrics");
    throw err;
  }
}

async function getDonorsWithoutRecommendationEmailOverLastNDays(numDays) {
  // Get list of donor emails not emailed with an item recommendation in last N days
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT
        donor_email, latest_recommendation_timestamp
      FROM
        donors_view
        LEFT JOIN
          (SELECT
            donor_email,
            MAX(recommendation_timestamp) AS latest_recommendation_timestamp
          FROM recommendations
          WHERE recommendation_medium = 'EMAIL'
          GROUP BY donor_email)
              as latest_recommendation_timestamps
          USING(donor_email)
      WHERE
        latest_recommendation_timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
          OR
          latest_recommendation_timestamp IS NULL;
      `,
      [numDays]
    );
    return results.map(row => row.donor_email);
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsWithoutRecommendationEmailOverLastNDays");
    throw err;
  }
}

async function getDonorsWithDonationInLastNDays(numDays) {
  // Get list of donor emails that have made a donation in the last N days
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT donor_email FROM donors_view
      WHERE most_recent_donation_timestamp > DATE_SUB(NOW(), INTERVAL ? DAY);
      `,
      [numDays]
    );
    return results.map(row => row.donor_email);
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsWithDonationInLastNDays");
    throw err;
  }
}

async function getItemsIdsAlreadyEmailedToDonor(donorEmail) {
  // Get list of itemIds already recommended to donor via email
  try {
    const conn = await config.dbInitConnectPromise();
    const [results] = await conn.query(`
      SELECT DISTINCT item_id from recommendations
      WHERE
        recommendation_medium = 'EMAIL' 
        AND donor_email = ?
      `,
      [donorEmail]
    );
    const itemIds = results.map(row => row.item_id);
    return itemIds;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getPastEmailRecommendations");
    throw err;
  }
}

// ---------- ITEM-CENTRIC RECOMMENDATION FRAMEWORK ---------- //

async function getDonorsBeneficiaryScoresForItemId(itemId) {
  // For now, score = 1 if donor has donated to this beneficiary before, 0 else
  // Returns dict: { duet.giving@gmail.com: 1, ... }
  // Note: donorEmails with beneficiaryScore=0 will be ommitted for the time being
  try {
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    if (!itemObj) {
      return null;
    }
    const beneficiaryId = itemObj.beneficiaryId;
    const donorsBeneficiaryCounts = await getDonorsBeneficiaryCounts();
    let donorsBeneficiaryScores = {};
    donorsBeneficiaryCounts
      .filter(row => row.beneficiary_id === beneficiaryId)
      .forEach(row => {
        donorsBeneficiaryScores[row.donor_email] = 1;
      });
    return donorsBeneficiaryScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsBeneficiaryScoresForItemId");
    throw err;
  }
}

async function getDonorsCategoryScoresForItemId(itemId) {
  // For now, score = 1 if donor has donated an item from this category before, 0 else
  // Returns dict: { duet.giving@gmail.com: 1, ... }
  // Note: donorEmails with categoryScore=0 will be ommitted for the time being
  try {
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    if (!itemObj) {
      return null;
    }
    const categoryId = itemObj.categoryId;
    const donorsCategoryCounts = await getDonorsCategoryCounts();
    let donorsCategoryScores = {};
    donorsCategoryCounts
      .filter(row => row.category_id === categoryId)
      .forEach(row => {
        donorsCategoryScores[row.donor_email] = 1;
      });
    return donorsCategoryScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsCategoryScoresForItemId");
    throw err;
  }
}

async function getDonorsPriceScoresForItemId(itemId) {
  // For now, score = 1 if item price is within donor's past price range (with variable buffer on both sides)
  // Returns dict: { duet.giving@gmail.com: 1, ... }
  // Note: donorEmails with priceScore=0 will be ommitted for the time being
  try {
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    if (!itemObj) {
      return null;
    }
    const price = itemObj.price;
    const donorsPriceMetrics = await getDonorsPriceMetrics();
    let donorsPriceScores = {};
    donorsPriceMetrics
      .filter(donor_row => 
        price >= donor_row.min_item_price - minPriceBuffer && 
        price <= donor_row.max_item_price + maxPriceBuffer)
      .forEach(donor_row => {
        donorsPriceScores[donor_row.donor_email] = 1;
      });
    return donorsPriceScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsPriceScoresForItemId");
    throw err;
  }
}

async function getDonorsOverallRecommendationScoresForItemId(itemId) {
  try {
    // Get recommendation scores for each donor
    // Returns nested dict: { duet.giving@gmail.com: { overallScore: 1, beneficiaryScore: 1}, ... }
    // Note: donorEmails with overallScore=0 will be ommitted for the time being
    const donorsCategoryScores = await getDonorsCategoryScoresForItemId(itemId);
    const donorsBeneficiaryScores = await getDonorsBeneficiaryScoresForItemId(itemId);
    const donorsPriceScores = await getDonorsPriceScoresForItemId(itemId);
    if (!donorsCategoryScores || !donorsBeneficiaryScores || !donorsPriceScores) {
      return null;
    }
    let donorsRecommendationScores = {};
    // add category scores
    for (const donorEmail in donorsCategoryScores) {
      if (!donorsRecommendationScores.hasOwnProperty(donorEmail)) {
        donorsRecommendationScores[donorEmail] = {
          overallScore: categoryScoreWeight * donorsCategoryScores[donorEmail],
          categoryScore: donorsCategoryScores[donorEmail]
        }
      }
      else {
        donorsRecommendationScores[donorEmail].overallScore += categoryScoreWeight * donorsCategoryScores[donorEmail];
        donorsRecommendationScores[donorEmail].categoryScore = donorsCategoryScores[donorEmail];
      }
    }
    // add beneficiary scores
    for (const donorEmail in donorsBeneficiaryScores) {
      if (!donorsRecommendationScores.hasOwnProperty(donorEmail)) {
        donorsBeneficiaryScores[donorEmail] = {
          overallScore: beneficiaryScoreWeight * donorsBeneficiaryScores[donorEmail],
          beneficiaryScore: donorsBeneficiaryScores[donorEmail]
        }
      }
      else {
        donorsRecommendationScores[donorEmail].overallScore += beneficiaryScoreWeight * donorsBeneficiaryScores[donorEmail];
        donorsRecommendationScores[donorEmail].beneficiaryScore = donorsBeneficiaryScores[donorEmail];
      }
    }
    // add price scores
    for (const donorEmail in donorsPriceScores) {
      if (!donorsRecommendationScores.hasOwnProperty(donorEmail)) {
        donorsRecommendationScores[donorEmail] = {
          overallScore: priceScoreWeight * donorsPriceScores[donorEmail],
          priceScore: donorsPriceScores[donorEmail]
        }
      }
      else {
        donorsRecommendationScores[donorEmail].overallScore += priceScoreWeight * donorsPriceScores[donorEmail];
        donorsRecommendationScores[donorEmail].priceScore = donorsPriceScores[donorEmail];
      }
    }
    return donorsRecommendationScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsOverallRecommendationScoresForItemId");
    throw err;
  }
}

// ---------- DONOR-CENTRIC RECOMMENDATION FRAMEWORK ---------- //

async function getItemsBeneficiaryScoresForDonorEmail(donorEmail) {
  // For now, score = 1 if donor has donated to the item's beneficiary before, 0 else
  // Returns dict indexed by itemId: { "53": 1, ... }
  // Note: itemIds with beneficiaryScore=0 will be ommitted for the time being
  try {
    // get all items on site (pool of possible items to recommend)
    const donatableItems = await itemHelpers.getDonatableItems();
    if (!donatableItems.length) {
      return null;
    }
    // get number of times this donorEmail has donated to each beneficiary
    let donorsBeneficiaryCounts = await getDonorsBeneficiaryCounts();
    donorsBeneficiaryCounts = donorsBeneficiaryCounts.filter(count => count.donor_email === donorEmail);
    if (!donorsBeneficiaryCounts.length) {
      return null; // donor not found
    }
    // calculate scores for each item
    let itemsBeneficiaryScores = {};
    donatableItems.forEach(item => {
      if (donorsBeneficiaryCounts.find(count => count.beneficiary_id === item.beneficiaryId)) {
        // donor has donated to this item's beneficiary before
        itemsBeneficiaryScores[item.itemId] = 1;
      }
    });
    return itemsBeneficiaryScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getItemsBeneficiaryScoresForDonorEmail");
    throw err;
  }
}

async function getItemsCategoryScoresForDonorEmail(donorEmail) {
  // For now, score = 1 if donor has donated to the item's category before, 0 else
  // Returns dict indexed by itemId: { "53": 1, ... }
  // Note: itemIds with categoryScore=0 will be ommitted for the time being
  try {
    // get all items on site (pool of possible items to recommend)
    const donatableItems = await itemHelpers.getDonatableItems();
    if (!donatableItems.length) {
      return null;
    }
    // get number of times this donorEmail has donated to each category
    let donorsCategoryCounts = await getDonorsCategoryCounts();
    donorsCategoryCounts = donorsCategoryCounts.filter(count => count.donor_email === donorEmail);
    if (!donorsCategoryCounts.length) {
      return null; // donor not found
    }
    // calculate scores for each item
    let itemsCategoryScores = {};
    donatableItems.forEach(item => {
      if (donorsCategoryCounts.find(count => count.category_id === item.categoryId)) {
        // donor has donated to this item's category before
        itemsCategoryScores[item.itemId] = 1;
      }
    });
    return itemsCategoryScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getItemsCategoryScoresForDonorEmail");
    throw err;
  }
}

async function getItemsPriceScoresForDonorEmail(donorEmail) {
  // For now, score = 1 if item price is within donor's past price range (with variable buffer on both sides)
  // Returns dict indexed by itemId: { "53": 1, ... }
  // Note: itemIds with priceScore=0 will be ommitted for the time being
  try {
    // get all items on site (pool of possible items to recommend)
    const donatableItems = await itemHelpers.getDonatableItems();
    if (!donatableItems.length) {
      return null;
    }
    // get this donorEmail's past {min, max} item prices
    const allDonorsPriceMetrics = await getDonorsPriceMetrics();
    const donorsPriceMetrics = allDonorsPriceMetrics.find(row => row.donor_email === donorEmail);
    if (!donorsPriceMetrics) {
      console.log(`getItemsPriceScoresForDonorEmail: donor ${donorEmail} not found!`);
      return null; // donor not found
    }
    // calculate scores for each item
    let itemsPriceScores = {};
    donatableItems.forEach(item => {
      if (item.price >= donorsPriceMetrics.min_item_price - minPriceBuffer &&
        item.price <= donorsPriceMetrics.max_item_price + maxPriceBuffer) {
        // item is within this donor's price range (including buffer)
        itemsPriceScores[item.itemId] = 1;
      }
    });
    return itemsPriceScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getItemsPriceScoresForDonorEmail");
    throw err;
  }
}

async function getItemsOverallRecommendationScoresForDonorEmail(donorEmail) {
  // Get recommendation scores for each item
  // Returns nested dict indexed by itemId: { "53": { overallScore: 1, beneficiaryScore: 1, ... }, ... }
  // Note: itemIds with overallScore=0 will be ommitted for the time being
  try {
    const itemsCategoryScores = await getItemsCategoryScoresForDonorEmail(donorEmail);
    const itemsBeneficiaryScores = await getItemsBeneficiaryScoresForDonorEmail(donorEmail);
    const itemsPriceScores = await getItemsPriceScoresForDonorEmail(donorEmail);
    if (!itemsCategoryScores || !itemsBeneficiaryScores || !itemsPriceScores) {
      console.log("getItemsOverallRecommendationScoresForDonorEmail: at least one score dict was null!");
      return null;
    }
    let itemsRecommendationScores = {};
    // add category scores
    for (const itemId in itemsCategoryScores) {
      if (!itemsRecommendationScores.hasOwnProperty(itemId)) {
        itemsRecommendationScores[itemId] = {
          overallScore: categoryScoreWeight * itemsCategoryScores[itemId],
          categoryScore: itemsCategoryScores[itemId]
        }
      }
      else {
        itemsRecommendationScores[itemId].overallScore += categoryScoreWeight * itemsCategoryScores[itemId];
        itemsRecommendationScores[itemId].categoryScore = itemsCategoryScores[itemId];
      }
    }
    // add beneficiary scores
    for (const itemId in itemsBeneficiaryScores) {
      if (!itemsRecommendationScores.hasOwnProperty(itemId)) {
        itemsRecommendationScores[itemId] = {
          overallScore: beneficiaryScoreWeight * itemsBeneficiaryScores[itemId],
          beneficiaryScore: itemsBeneficiaryScores[itemId]
        }
      }
      else {
        itemsRecommendationScores[itemId].overallScore += beneficiaryScoreWeight * itemsBeneficiaryScores[itemId];
        itemsRecommendationScores[itemId].beneficiaryScore = itemsBeneficiaryScores[itemId];
      }
    }
    // add price scores
    for (const itemId in itemsPriceScores) {
      if (!itemsRecommendationScores.hasOwnProperty(itemId)) {
        itemsRecommendationScores[itemId] = {
          overallScore: priceScoreWeight * itemsPriceScores[itemId],
          priceScore: itemsPriceScores[itemId]
        }
      }
      else {
        itemsRecommendationScores[itemId].overallScore += priceScoreWeight * itemsPriceScores[itemId];
        itemsRecommendationScores[itemId].priceScore = itemsPriceScores[itemId];
      }
    }
    return itemsRecommendationScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getItemsOverallRecommendationScoresForDonorEmail");
    throw err;
  }
}

function itemScoresDictToList(itemsRecommendationScores) {
  // convert itemsRecommendationScores to list form, sorted in descending order by overallScore
  // Input: { "53": { overallScore: 1, beneficiaryScore: 1, ... }, ... }
  // Returns: [ { itemId: 53, overallScore: 2, beneficiaryScore: 1, ... }, ... ]
  try {
    let itemScoresList = [];
    for (const itemId in itemsRecommendationScores) {
      itemScoresList.push({
        itemId: Number(itemId),
        ...itemsRecommendationScores[itemId]
      });
    }
    jsUtils.shuffleInPlace(itemScoresList); // randomly shuffle, so that items get unsorted by itemId
    const itemScoresListSorted = itemScoresList.sort((a, b) => b.overallScore - a.overallScore);
    return itemScoresListSorted;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/itemScoresDictToList");
    throw err;
  }
}

async function selectItemsToRecommendToDonor(donorEmail, numItems) {
  // Get list of itemIds to recommend to donor (along with the recommendation scores)
  // Filter out already-recommended items, and get N items with top overallScore
  // Returns: [ { itemId: 53, overallScore: 2, beneficiaryScore: 1, ... }, ... ]
  try {
    const alreadyRecommendedItemIds = await getItemsIdsAlreadyEmailedToDonor(donorEmail);
    const itemsRecommendationScoresDict = await getItemsOverallRecommendationScoresForDonorEmail(donorEmail);
    if (!itemsRecommendationScoresDict) {
      return null;
    }
    const itemScoresListSorted = itemScoresDictToList(itemsRecommendationScoresDict);
    const selectedItemScores = itemScoresListSorted
      .filter(itemScore => !alreadyRecommendedItemIds.includes(itemScore.itemId))
      .slice(0, numItems);
    return selectedItemScores;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/selectItemsToRecommendToDonor");
    throw err;
  }
}

async function sendRecommendationEmailToDonor(donorEmail) {
  // Select items and send recommendation email to donorEmail
  try {
    // get items to recommend
    const selectedItemScores = await selectItemsToRecommendToDonor(donorEmail, numItemsToRecommend);
    if (!selectedItemScores) {
      console.log(`sendRecommendationEmailToDonor: ${donorEmail} has no recommendable items!`);
      return null;
    }
    const selectedItemIds = selectedItemScores.map(selectedItemScore => selectedItemScore.itemId);
    // send recommendation email
    await sendgridHelpers.sendItemRecommendationEmail(donorEmail, selectedItemIds);
    // log recommendations in DB
    await Promise.all(selectedItemScores.map(async itemScore => {
      await logRecommendationInDB(donorEmail, itemScore.itemId, "EMAIL", itemScore.overallScore);
    }));
    return { donorEmail, selectedItemScores };
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/sendRecommendationEmailToDonor");
    throw err;
  }
}

async function getDonorsNeedingRecommendationEmail() {
  // Get donors not emailed within last N days, and having at least N days since last donation
  try {
    console.log("Getting donors needing recommendation email...");
    const notEmailedRecently = await getDonorsWithoutRecommendationEmailOverLastNDays(recommendationEmailIntervalDays);
    const donatedRecently = await getDonorsWithDonationInLastNDays(recommendationEmailIntervalDays);
    console.log(`notEmailedRecently: ${JSON.stringify(notEmailedRecently)}`);
    console.log(`donatedRecently: ${JSON.stringify(donatedRecently)}`);
    const donorsToEmail = notEmailedRecently.filter(donorEmail => !donatedRecently.includes(donorEmail));
    console.log(`donorsToEmail: ${JSON.stringify(donorsToEmail)}`);
    return donorsToEmail;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/getDonorsNeedingRecommendationEmail");
    throw err;
  }
}

async function sendItemRecommendationEmailsToDonors() {
  // Get donors not emailed within last N days, and send each of them a recommendation email
  // Returns: [ { donorEmail: "duet.giving@gmail.com", selectedItemScores: [ ... ] }, ... ]
  try {
    const donorEmailsNeedingRecommendation = await getDonorsNeedingRecommendationEmail();
    const recommendationEmailResult = await Promise.all(
      donorEmailsNeedingRecommendation.map(async donorEmail => {
        const { selectedItemScores } = await sendRecommendationEmailToDonor(donorEmail);
        return { donorEmail, selectedItemScores };
      }));
    return recommendationEmailResult;
  } catch (err) {
    errorHandler.handleError(err, "recommendationHelpers/sendItemRecommendationEmailsToDonors");
    throw err;
  }
}

export default {
  // item-centric recommendation framework
  getDonorsOverallRecommendationScoresForItemId,

  // donor-centric recommendation framework
  getDonorsNeedingRecommendationEmail,
  getItemsOverallRecommendationScoresForDonorEmail,
  sendRecommendationEmailToDonor,
  sendItemRecommendationEmailsToDonors
};
