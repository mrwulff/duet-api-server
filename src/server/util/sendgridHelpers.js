require("dotenv").config();
import config from "../util/config.js";
import errorHandler from "../util/errorHandler.js";
import donationHelpers from "../util/donationHelpers.js";
import donorHelpers from "../util/donorHelpers.js";
import itemHelpers from "../util/itemHelpers.js";
import beneficiaryHelpers from "../util/beneficiaryHelpers.js";
import storeHelpers from "../util/storeHelpers.js";
const sgMail = config.sendgridInit(); // Sendgrid

const unsubGroupId = 11371; // Automated Donation Updates unsub group

function capitalizeAndTrimName(nameStr) {
  const capitalized = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
  return capitalized.trim()
}

async function sendErrorEmail(err, functionName) {
  try {
    // Send error email to duet.giving@gmail.com
    const msg = {
      to: "duet.giving@gmail.com",
      from: "duet.giving@gmail.com",
      templateId: "d-baf6edabb26741189b2835f0f3c7258e",
      dynamic_template_data: {
        environment: (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") ? "PROD" : "SANDBOX",
        functionName: functionName,
        error: err
      }
    }
    await sgMail.send(msg);
    console.log(`Error message sent to duet.giving@gmail.com`);
  } catch(err) {
    console.log("Error when sending error email (lol): " + err);
  }
}

async function sendDonorThankYouEmailV2(donationId) {
  try {
    // get necessary data
    const donationObj = await donationHelpers.getDonationObjFromDonationId(donationId);
    const beneficiaryId = donationObj.items[0].beneficiaryId; // NOTE: assume all items are from the same beneficiary
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithoutNeedsFromBeneficiaryId(beneficiaryId);
    // create sendgrid message
    const emailTemplateId = "d-fb8c05dc69cd4bcbae0bb47f3571ef7d";
    let subjectTag = "";
    let recipientList;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") {
      recipientList = [donationObj.donor.donorEmail, "duet.giving@gmail.com"];
    } else {
      recipientList = ["duet.giving@gmail.com"];
      subjectTag = "[SANDBOX] ";
    }
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subjectTag: subjectTag,
        donor: {
          ...donationObj.donor, 
          donorFirst: capitalizeAndTrimName(donationObj.donor.donorFirst), 
          donorLast: capitalizeAndTrimName(donationObj.donor.donorLast), 
        },
        donation: {...donationObj, donationAmtUsd: donationObj.donationAmtUsd.toFixed(2)},
        beneficiary: beneficiaryObj,
        items: donationObj.items.map(itemObj => ({...itemObj, price: itemObj.price.toFixed(2)})),
      },
      asm: {
        groupId: unsubGroupId
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Donation thank you v2 message delivered successfully to ${recipientList}`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendDonorThankYouEmailV2");
  }
}

async function sendTypeformErrorEmail(formTitle, eventId, errMessage) {
  try {
    // Send error email if Typeform response can't get added to DB
    msg = {
      to: "duet.giving@gmail.com",
      from: "duet.giving@gmail.com",
      templateId: "d-6ecc5d7df32c4528b8527c248a212552",
      dynamic_template_data: {
        formTitle: formTitle,
        eventId: eventId,
        error: errMessage
      }
    }
    await sgMail.send(msg);
    console.log("Sendgrid error message delived successfully.");
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendTypeformErrorEmail");
  }
}

async function sendStoreItemVerificationEmail(storeObj, itemObjs) {
  try {
    // Send store notification email
    let subject;
    let recipientList;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
      subject = "Duet: The following items need your attention!";
      recipientList = ["duet.giving@gmail.com", storeObj.storeEmail];
    } else {
      subject = "[SANDBOX] Duet: The following items need your attention!";
      recipientList = ["duet.giving@gmail.com"];
    }
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: "d-435a092f0be54b07b5135799ac7dfb01",
      dynamic_template_data: {
        store: storeObj,
        items: itemObjs,
        subject: subject
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Store notification email delivered to ${storeObj.storeName} at ${storeObj.storeEmail} successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendStoreItemVerificationEmail");
  }
}

async function sendStorePaymentEmail(storePaymentInfo) {
  // Inputs: storeEmail, storeName, paymentAmountEuros, paymentMethod, itemIds (list)
  try {
    let subject;
    let recipientList;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
      subject = "Duet: You have an incoming payment!";
      recipientList = ["duet.giving@gmail.com", storePaymentInfo.storeEmail];
    } else {
      subject = "[SANDBOX] Duet: You have an incoming payment!";
      recipientList = ["duet.giving@gmail.com"];
    }
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: "d-65decba44d8e4ba08439fe846db2340c",
      dynamic_template_data: {
        storeName: storePaymentInfo.storeName,
        paymentAmountEuros: storePaymentInfo.paymentAmountEuros,
        paymentMethod: storePaymentInfo.paymentMethod,
        itemIds: storePaymentInfo.itemIds, // string (e.g. #41, #42, #43)
        subject: subject
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Store payment email delivered to ${storePaymentInfo.storeName} at ${storePaymentInfo.storeEmail} successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendStorePaymentEmail");
  }
}

async function sendBalanceUpdateEmail(paymentSite, currency, balance, subjectTag) {
  try {
    const env = (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" ? "PROD" : "SANDBOX");
    const msg = {
      to: "duet.giving@gmail.com",
      from: "duet@giveduet.org",
      templateId: "d-3bd8a48f8cf64a188e4fd3b6ef73faf8",
      dynamic_template_data: {
        subject: `[${env} - ${subjectTag}] Account Balance Update`,
        paymentSite: paymentSite,
        currency: currency,
        balance: balance
      }
    };
    await sgMail.send(msg);
    console.log(`${paymentSite} balance update email delivered to duet.giving@gmail.com successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendBalanceUpdateEmail");
  }
}

async function sendItemStatusUpdateEmail(itemObj) {
  try {
    if (process.env.SEND_ITEM_STATUS_UPDATE_EMAILS === "false") {
      return;
    }
    // Send item status update email
    const emailTemplateId = 'd-15967181f418425fa3510cb674b7f580';
    const msg = {
      to: "duet.giving@gmail.com",
      from: "duet.giving@gmail.com",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subject: (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") ? "[PROD] - Item Status Update" : "[SANDBOX] - Item Status Update",
        status: itemObj.status,
        itemId: itemObj.itemId,
        itemName: itemObj.name,
        itemSize: itemObj.size,
        itemLink: itemObj.image,
        pickupCode: itemObj.pickupCode,
        refugeeName: `${itemObj.beneficiaryFirst} ${itemObj.beneficiaryLast}`,
        refugeeId: itemObj.beneficiaryId,
        storeName: itemObj.storeName,
        donorName: `${itemObj.donorFirst} ${itemObj.donorLast}`,
        donorEmail: itemObj.donorEmail,
      }
    };
    await sgMail.send(msg);
    console.log(`Item status update message delivered to Duet successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendItemStatusUpdateEmail");
  }
}

async function sendItemPickedUpEmailV2(itemId) {
  try {
    // get necessary objects
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    if (itemObj.status !== 'PICKED_UP') {
      throw new Error(`Attempted to call sendItemPickedUpEmailV2 on a non-picked up item: ${itemId}`);
    }
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryObjWithoutNeedsFromBeneficiaryId(itemObj.beneficiaryId);
    const donorObj = await donorHelpers.getDonorObjFromDonorEmail(itemObj.donorEmail);
    const storeObj = await storeHelpers.getStoreObjFromStoreId(itemObj.storeId);
    // create sendgrid email
    let subjectTag = "";
    let recipientList;
    const emailTemplateId = "d-aa4552b94fd24480b073164e984c0483";
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") {
      recipientList = [donorObj.donorEmail, "duet.giving@gmail.com"];
    } else {
      recipientList = ["duet.giving@gmail.com"];
      subjectTag = "[SANDBOX] ";
    }
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subjectTag: subjectTag,
        item: {...itemObj, price: itemObj.price.toFixed(2)},
        donor: {
          ...donationObj.donor,
          donorFirst: capitalizeAndTrimName(donationObj.donor.donorFirst),
          donorLast: capitalizeAndTrimName(donationObj.donor.donorLast), 
        },
        beneficiary: beneficiaryObj,
        store: storeObj
      },
      asm: {
        groupId: unsubGroupId
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Item pickup message V2 delivered successfully to ${recipientList}`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendItemPickedUpEmailV2");
  }
}

export default {
  sendErrorEmail,
  sendTypeformErrorEmail,
  sendDonorThankYouEmailV2,
  sendStoreItemVerificationEmail,
  sendStorePaymentEmail,
  sendBalanceUpdateEmail,
  sendItemStatusUpdateEmail,
  sendItemPickedUpEmailV2
};
