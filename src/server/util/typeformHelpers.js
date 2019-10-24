import config from '../util/config.js';
import errorHandler from './errorHandler.js';

async function insertItemFromTypeform(itemInfo) {
  // TODO: clean this up (use item object?)
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,comment,status,store_id,link,in_notification) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?)",
      [itemInfo.itemNameEnglish,
        itemInfo.size,
        itemInfo.price,
        itemInfo.beneficiaryId,
        itemInfo.categoryId,
        itemInfo.comment,
        itemInfo.status,
        itemInfo.storeId,
        itemInfo.photoUrl,
        itemInfo.in_notification]
    );
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/insertItemFromTypeform");
    throw err;
  }
}

async function updateItemPickupCode(itemId, pickupCode) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET pickup_code=? WHERE item_id=?",
      [pickupCode, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/updateItemPickupCode");
    throw err;
  }
}

async function updateItemPhotoLink(itemId, photoUrl) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET link=? WHERE item_id=?",
      [photoUrl, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/updateItemPhotoLink");
    throw err;
  }
}

async function getItemNameTranslation(language, itemName) {
  // Get name_english, category_id from itemName in given language
  try {
    const conn = await config.dbInitConnectPromise();
    const [matchedItemNames, fields] = await conn.query(
      "SELECT name_english, category_id FROM item_types WHERE ?? LIKE ?",
      ["name_" + language, "%" + itemName + "%"]
    );
    return matchedItemNames[0];
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/getItemNameTranslation");
    throw err;
  }
}

// find question from array with a given Typeform question-reference
// use startsWith instead of ===, because there are multiple item-name-... questions for different categories
function getAnswerFromQuestionReference(questionReference, answers, type) {
  try {
    const answer = answers.find(answer => answer.field.ref.startsWith(questionReference));
    if (!answer) {
      // not found
      console.log("questionReference not found: " + questionReference);
      return null;
    }
    if (type === 'choice') {
      return answer.choice.label;
    } if (type === 'text') {
      return answer.text;
    } if (type === 'file') {
      return answer.file_url;
    } if (type === 'phone_number') {
      return answer.phone_number;
    } 
    throw new Error(`Unknown Typeform question type: ${type}`);
    
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/getAnswerFromQuestionReference");
    throw err;
  }
}

// process raw price input, return a decimal value
function processPriceInput(origPrice) {
  var price = origPrice.trim();
  // Special case: 19€90 --> 19.90
  if (price.match(/\+?\d+[€,$][0-9]{2}$/g)) { // matches any number of digits, followed by $ or €, followed by 2 digits
    price = price.replace(/[€,$]/g, "."); // replace currency symbol with "."
  }
  price = price.replace(",", '.').replace(":", "."); // replace "," or ":" with "."
  price = price.replace(/[^\d.]/g, ''); // remove any remaining non-decimal characters
  return price;
}

export default {
  insertItemFromTypeform,
  updateItemPickupCode,
  updateItemPhotoLink,
  getItemNameTranslation,
  getAnswerFromQuestionReference,
  processPriceInput
}