// Imports
import itemHelpers from '../util/itemHelpers.js';
import s3Helpers from '../util/s3Helpers.js';
import storeHelpers from '../util/storeHelpers.js';
import beneficiaryHelpers from '../util/beneficiaryHelpers.js';
import sendgridHelpers from '../util/sendgridHelpers.js';
import errorHandler from '../util/errorHandler.js';
import typeformHelpers from '../util/typeformHelpers.js';
import fbHelpers from '../util/fbHelpers.js';

// function testUploadItemImageToS3(req, res) {
//   try {
//     s3Helpers.uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
//     res.status(200).send();
//   } catch (e) {
//     res.status(500).send({ error: e });
//   }
// }

async function processTypeformV4(req, res) {
  try {
    console.log("Processing TypeForm (V4)");
    const answers = req.body.form_response.answers;
    const formTitle = req.body.form_response.definition.title;
    const formQuestions = req.body.form_response.definition.fields;
    const eventId = req.body.form_response.eventId;

    // Check which language was used
    let language = null;
    if (formTitle.includes("English")) {
      language = "english";
    } else if (formTitle.includes("Arabic")) {
      language = "arabic";
    } else if (formTitle.includes("Farsi")) {
      language = "farsi";
    } else {
      console.log("Invalid language");
      throw new Error("Unknown Typeform language");
    }

    // Get responses
    const passcode = typeformHelpers.getAnswerFromQuestionReference("beneficiary-code", answers, 'text');
    const phoneNum = typeformHelpers.getAnswerFromQuestionReference("phone-num", answers, 'phone_number');
    const photoUrl = encodeURI(typeformHelpers.getAnswerFromQuestionReference("item-photo", answers, 'file'));
    let priceTagPhotoUrl = typeformHelpers.getAnswerFromQuestionReference("price-tag-photo", answers, 'file');
    if (priceTagPhotoUrl) {
      priceTagPhotoUrl = encodeURI(priceTagPhotoUrl);
    }
    const itemName = typeformHelpers.getAnswerFromQuestionReference("item-name", answers, 'choice');
    const origPrice = typeformHelpers.getAnswerFromQuestionReference("item-price", answers, 'text');
    console.log("Original price: " + origPrice);
    let price = typeformHelpers.processPriceInput(origPrice);
    console.log("Processed price: " + price);
    const size = typeformHelpers.getAnswerFromQuestionReference("item-size", answers, 'text'); // might be null
    const comment = typeformHelpers.getAnswerFromQuestionReference("comment", answers, 'text'); // might be null
    const store = typeformHelpers.getAnswerFromQuestionReference("store-name", answers, 'choice');

    if (isNaN(price) || price <= 0) {
      console.log("Invalid price: " + origPrice);
      console.log("Setting price to 0...");
      price = 0;
    }

    // Translate itemName to English by matching itemName in item_types table
    // And get categoryId while we're at it
    const itemTranslationResult = await typeformHelpers.getItemNameTranslation(language, itemName);
    if (!itemTranslationResult) {
      console.log("Invalid item name");
      throw new Error("Invalid item name! Table: name_" + language + "; itemName: " + itemName);
    }
    const itemNameEnglish = itemTranslationResult.name_english;
    const categoryId = itemTranslationResult.category_id;

    // Get store, beneficiary info
    const beneficiaryId = await beneficiaryHelpers.getBeneficiaryIdFromPasscode(passcode);
    if (!beneficiaryId) {
      return res.sendStatus(404);
    }
    const storeObj = await storeHelpers.getStoreObjFromStoreName(store);

    // insert item
    let itemId;
    try {
      const itemInfo = {
        itemNameEnglish: itemNameEnglish,
        size: size,
        price: price,
        beneficiaryId, beneficiaryId,
        categoryId: categoryId,
        comment: comment,
        status: 'REQUESTED',
        storeId: storeObj.storeId,
        photoUrl: photoUrl,
        priceTagPhotoUrl: priceTagPhotoUrl,
        in_notification: 0
      };
      itemId = await typeformHelpers.insertItemFromTypeform(itemInfo);
    } catch (err) {
      // Sendgrid Error message (email)
      console.log("Failed to insert item from typeform into DB. Sending error email...");
      sendgridHelpers.sendTypeformErrorEmail(formTitle, eventId, err.toString());
      return res.sendStatus(500);
    }

    // get code for item
    const code = itemHelpers.generatePickupCode(itemId);
    await typeformHelpers.updateItemPickupCode(itemId, code);

    // Rehost item photo in S3; update photo link in DB
    const imageLink = await s3Helpers.uploadItemImageToS3(itemId, photoUrl);
    await typeformHelpers.updateItemPhotoLink(itemId, imageLink);
    // Rehost price-tag image in S3; update link in DB
    if (priceTagPhotoUrl) {
      const priceTagImageLink = await s3Helpers.uploadPriceTagImageToS3(itemId, priceTagPhotoUrl);
      await typeformHelpers.updatePriceTagPhotoLink(itemId, priceTagImageLink);
    }

    // Confirmation message to refugee
    const monthlyBudget = await beneficiaryHelpers.getMonthlyEurBudget(beneficiaryId);
    if (monthlyBudget) {
      // check if overbudget
      const eurRequested = await beneficiaryHelpers.getTotalEurRequestedThisMonth(beneficiaryId);
      if (eurRequested > monthlyBudget) {
        console.log("Item is overbudget! Calling sendOverBudgetItemRequestMessage");
        await itemHelpers.updateSingleItemStatus("GRAVEYARD", itemId);
        await fbHelpers.sendOverBudgetItemRequestMessage(beneficiaryId, itemId);
      } else {
        console.log("Item is within budget: calling sendSuccessfulItemRequestMessageWithBudget");
        await fbHelpers.sendSuccessfulItemRequestMessageWithBudget(beneficiaryId, itemId);
      }
    } else {
      // no budget
      console.log("Beneficiary has no budget: calling sendSuccessfulItemRequestMessageNoBudget")
      await fbHelpers.sendSuccessfulItemRequestMessageNoBudget(beneficiaryId, itemId);
    }
    
    // Send slack message to Duet
    if (process.env.NODE_ENV === 'production') {
      await typeformHelpers.sendNewItemRequestSlackMessage(itemId);
    }

    console.log("Successfully processed Typeform response");
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "typeform/processTypeformV4");
    return res.sendStatus(500);
  }
}

export default {
  processTypeformV4,
  // testUploadItemImageToS3
};