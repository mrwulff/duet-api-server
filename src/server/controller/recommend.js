import errorHandler from "../util/errorHandler.js";
import itemHelpers from '../util/itemHelpers.js';
import recommendationHelpers from '../util/recommendationHelpers.js';

async function getDonorsNeedingRecommendationEmail(req, res) {
  try {
    const donorsNeedingRecommendationEmail = await recommendationHelpers.getDonorsNeedingRecommendationEmail();
    console.log(`getDonorsNeedingRecommendationEmail: donorsNeedingRecommendationEmail = ${JSON.stringify(donorsNeedingRecommendationEmail)}`);
    return res.json({ donorsNeedingRecommendationEmail });
  } catch (err) {
    errorHandler.handleError(err, "recommender/getDonorsNeedingRecommendationEmail");
    return res.sendStatus(500);
  }
}

async function getRecommendationScores(req, res) {
  try {
    // Passed in itemId: calculate recommendation score for each donor
    if (req.body.itemId) {
      console.log(`getRecommendationScores: getting recommendation scores by itemId: ${req.body.itemId}`);
      const donorsRecommendationScores = await recommendationHelpers.getDonorsOverallRecommendationScoresForItemId(req.body.itemId);
      if (!donorsRecommendationScores) {
        return res.sendStatus(400);
      }
      const itemObj = await itemHelpers.getItemObjFromItemId(req.body.itemId);
      return res.json({
        donorsRecommendationScores,
        item: itemObj
      });
    }
    // Passed in donorEmail: calculate recommendation score for each item
    else if (req.body.donorEmail) {
      console.log(`getRecommendationScores: getting recommendation scores by donorEmail: ${req.body.donorEmail}`);
      const itemsRecommendationScores = await recommendationHelpers.getItemsOverallRecommendationScoresForDonorEmail(req.body.donorEmail);
      if (!itemsRecommendationScores) {
        return res.sendStatus(400);
      }
      return res.json({
        donorEmail: req.body.donorEmail,
        itemsRecommendationScores
      });
    }
    return res.sendStatus(400);
  } catch (err) {
    errorHandler.handleError(err, "recommender/getRecommendationScores");
    return res.sendStatus(500);
  }
}

async function sendRecommendationEmail(req, res) {
  try {
    // Passed in donorEmail: select N items to recommend
    if (req.body.donorEmail) {
      console.log(`sendRecommendationEmail: sending recommendation email to ${req.body.donorEmail}`);
      const recommendationEmailResult = await recommendationHelpers.sendRecommendationEmailToDonor(req.body.donorEmail);
      if (!recommendationEmailResult) {
        return res.sendStatus(400);
      }
      console.log(`sendRecommendationEmail: recommendationEmailResult: ${JSON.stringify(recommendationEmailResult)}`);
      return res.json(recommendationEmailResult);
    }
    return res.sendStatus(400);
  } catch (err) {
    errorHandler.handleError(err, "recommender/sendRecommendationEmail");
    return res.sendStatus(500);
  }
}

export default {
  getDonorsNeedingRecommendationEmail,
  getRecommendationScores,
  sendRecommendationEmail
};
