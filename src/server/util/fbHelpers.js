// Imports
require("dotenv").config();
import config from '../util/config.js';
import sqlHelpers from './sqlHelpers.js';
import errorHandler from './errorHandler.js';
const messenger = config.fbMessengerInit(); // FB Messenger

async function sendPickupNotification(itemId) {
  // Send pickup notification for itemId
  try {
    let fbMessengerInfo = await sqlHelpers.getFBMessengerInfoFromItemId(itemId);
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

    messenger.sendTextMessage({
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

export default {
  sendPickupNotification
}