// Imports
require("dotenv").config();
import config from '../util/config.js';
import beneficiaryHelpers from '../util/beneficiaryHelpers.js';
import itemHelpers from '../util/itemHelpers.js';
import errorHandler from './errorHandler.js';
const messenger = config.fbMessengerInit(); // FB Messenger
import format from 'string-template';

// Insert message into database
async function insertMessageIntoDB(message) {
  const source = message.source;
  const sender = message.sender;
  const recipient = message.recipient;
  const content = message.content;
  const attachments = message.attachments;
  try {
    const conn = await config.dbInitConnectPromise();
    // insert message
    const [results, fields] = await conn.query(
      "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
      [source, sender, recipient, content]
    );
    const messageId = results.insertId;
    // insert attachments
    if (attachments) {
      await Promise.all(attachments.map(async attachment => {
        await conn.query("INSERT INTO message_attachments (message_id, attachment_type, attachment_url) VALUES (?,?,?)",
          [messageId, attachment.type, attachment.payload.url]);
      }));
    }
    console.log(`Successfully inserted messageId ${messageId} into database: ${JSON.stringify(message)}`);
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/insertMessageIntoDB");
    throw err;
  }
}

// Get all info necessary to send a pickup notification
// TODO: use item, beneficiary, donor objects instead
async function getFBMessengerInfoFromItemId(itemId) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT " +
      "item_name, pickup_code, item_photo_link, " +
      "fb_psid, beneficiary_first, beneficiary_last, language, " +
      "store_name, " +
      "donor_first, donor_last, donor_country " +
      "FROM items_view " +
      "WHERE item_id=?",
      [itemId]
    );
    if (rows.length === 0) {
      console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);
      return null;
    }
    return rows[0];
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/getFBMessengerInfoFromItemId");
    throw err;
  }
}

async function sendPickupNotification(itemId) {
  // Send pickup notification for itemId
  try {
    const fbMessengerInfo = await getFBMessengerInfoFromItemId(itemId);
    let message = "";
    // Arabic
    if (fbMessengerInfo.language === 'ar') {
      message += "مرحبًا ، هذه رسالة تلقائية من Duet\n";
      message += "لديك عنصر متاح للاستلام!\n";
      message += "صورة فوتوغرافية: " + fbMessengerInfo.item_photo_link + "\n";
      message += "اسم المتجر: " + fbMessengerInfo.store_name + "\n";
      if (fbMessengerInfo.donor_first && fbMessengerInfo.donor_last && fbMessengerInfo.donor_country) {
        message += "اسم المانح: " + fbMessengerInfo.donor_first + " " + fbMessengerInfo.donor_last + "\n";
        message += "الدولة المانحة: " + fbMessengerInfo.donor_country + "\n";
      }
      message += "يرجى إظهار هذا الرمز لمالك المتجر: " + fbMessengerInfo.pickup_code + "\n";
      message += "بعد التقاط العنصر ، يرجى تذكر أن ترسل لنا صورة أخرى للعنصر.";
    }
    // Farsi
    else if (fbMessengerInfo.language === 'fa') {
      message += "سلام ، این یک پیام خودکار از Duet است\n";
      message += "شما یک مورد برای وانت در دسترس دارید!\n";
      message += "عکس: " + fbMessengerInfo.item_photo_link + "\n";
      message += "نام فروشگاه: " + fbMessengerInfo.store_name + "\n";
      if (fbMessengerInfo.donor_first && fbMessengerInfo.donor_last && fbMessengerInfo.donor_country) {
        message += "نام اهدا کننده: " + fbMessengerInfo.donor_first + " " + fbMessengerInfo.donor_last + "\n";
        message += "کشور اهدا کننده: " + fbMessengerInfo.donor_country + "\n";
      }
      message += "لطفاً این کد را به صاحب فروشگاه نشان دهید: " + fbMessengerInfo.pickup_code + "\n";
      message += "پس از دریافت کالا ، یادتان باشد که عکس دیگری را برای ما ارسال کنید.";
    }
    // Other (Including English)
    else {
      message += (fbMessengerInfo.beneficiary_first) ? "Hi " + fbMessengerInfo.beneficiary_first : "Hi";
      message += ", this is an automated message from Duet.\n";
      message += "You have an item available for pickup!\n";
      message += `Photo: ${fbMessengerInfo.item_photo_link}\n`;
      message += `Store name: ${fbMessengerInfo.store_name}\n`;
      if (fbMessengerInfo.donor_first && fbMessengerInfo.donor_last && fbMessengerInfo.donor_country) {
        message += "This item was donated by " + fbMessengerInfo.donor_first + " " + fbMessengerInfo.donor_last +
          " (Country: " + fbMessengerInfo.donor_country + ").\n";
      }
      message += `Please show this code to the store owner: ${fbMessengerInfo.pickup_code}\n`;
      message += "After you pick up the item, please remember to send us another photo.";
    }

    await messenger.sendTextMessage({
      id: fbMessengerInfo.fb_psid,
      text: message,
      messaging_type: "MESSAGE_TAG",
      tag: "SHIPPING_UPDATE"
    });

    console.log('Sent pickup notification to ' + fbMessengerInfo.beneficiary_first + " " + fbMessengerInfo.beneficiary_last +
            " for " + fbMessengerInfo.item_name + " with itemId: " + itemId);
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/sendPickupNotification");
    throw err;
  }
}

async function sendOverBudgetItemRequestMessage(beneficiaryId, itemId) {
  try {
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId);
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    const itemRequestMessages = require('../assets/fb_messages/item_request_messages.json');
    const messageTemplate = itemRequestMessages.overbudgetMessages[beneficiaryObj.language];
    const eurosRequested = await beneficiaryHelpers.getTotalEurRequestedThisMonth(beneficiaryId);
    const messageFilled = format(messageTemplate, {
      itemPhotoLink: itemObj.image,
      itemPrice: itemObj.price.toFixed(2),
      totalEurRequestedThisMonth: eurosRequested.toFixed(2),
      monthlyEurBudget: beneficiaryObj.monthlyBudgetEur.toFixed(2)
    });
    await messenger.sendTextMessage({
      id: beneficiaryObj.fbPsid,
      text: messageFilled,
      messaging_type: "MESSAGE_TAG",
      tag: "SHIPPING_UPDATE"
    });
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/sendOverBudgetItemRequestMessage");
    throw err;
  }
}

async function sendSuccessfulItemRequestMessageWithBudget(beneficiaryId, itemId) {
  try {
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId);
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    const itemRequestMessages = require('../assets/fb_messages/item_request_messages.json');
    const messageTemplate = itemRequestMessages.successfulMessagesWithBudget[beneficiaryObj.language];
    const eurosRequested = await beneficiaryHelpers.getTotalEurRequestedThisMonth(beneficiaryId);
    const monthlyBudget = await beneficiaryHelpers.getMonthlyEurBudget(beneficiaryId);
    const messageFilled = format(messageTemplate, {
      itemPhotoLink: itemObj.image,
      itemPrice: itemObj.price.toFixed(2),
      totalEurRequestedThisMonth: eurosRequested.toFixed(2),
      monthlyEurBudget: monthlyBudget.toFixed(2)
    });
    await messenger.sendTextMessage({
      id: beneficiaryObj.fbPsid,
      text: messageFilled,
      messaging_type: "MESSAGE_TAG",
      tag: "SHIPPING_UPDATE"
    });
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/sendSuccessfulItemRequestMessage");
    throw err;
  }
}

async function sendSuccessfulItemRequestMessageNoBudget(beneficiaryId, itemId) {
  try {
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId);
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    const itemRequestMessages = require('../assets/fb_messages/item_request_messages.json');
    const messageTemplate = itemRequestMessages.successfulMessagesNoBudget[beneficiaryObj.language];
    const messageFilled = format(messageTemplate, {
      itemPhotoLink: itemObj.image,
      itemPrice: itemObj.price.toFixed(2),
    });
    await messenger.sendTextMessage({
      id: beneficiaryObj.fbPsid,
      text: messageFilled,
      messaging_type: "MESSAGE_TAG",
      tag: "SHIPPING_UPDATE"
    });
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/sendSuccessfulItemRequestMessageNoBudget");
    throw err;
  }
}

async function sendFBMessageToAllVisibleBeneficiaries(messageTemplates) {
  // messageTemplates: message templates for each language ('en', 'fa', 'ar')
  try {
    const allBeneficiaryObjs = await beneficiaryHelpers.getAllBeneficiaryObjsWithoutNeeds();
    const visibleBeneficiaryObjs = allBeneficiaryObjs.filter(beneficiaryObj => beneficiaryObj.visible);
    await Promise.all(visibleBeneficiaryObjs.map(async beneficiaryObj => {
      // fill in message template using beneficiaryObj fields
      const messageTemplate = messageTemplates[beneficiaryObj.language];
      const messageFilled = format(messageTemplate, beneficiaryObj);
      // send message
      await messenger.sendTextMessage({
        id: beneficiaryObj.fbPsid,
        text: messageFilled,
        messaging_type: "MESSAGE_TAG",
        tag: "SHIPPING_UPDATE"
      });
    }));
  } catch (err) {
    errorHandler.handleError(err, "fbHelpers/sendFBMessageToAllVisibleBeneficiaries");
    throw err;
  }
}

export default {
  // Data modeling
  insertMessageIntoDB,

  // Item requests
  sendSuccessfulItemRequestMessageWithBudget,
  sendOverBudgetItemRequestMessage,
  sendSuccessfulItemRequestMessageNoBudget,

  // Pickup notifications
  sendPickupNotification,

  // Announcements
  sendFBMessageToAllVisibleBeneficiaries
}
