require("dotenv").config();
import config from "../util/config.js";
import errorHandler from "../util/errorHandler.js";
const sgMail = config.sendgridInit(); // Sendgrid

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

async function sendDonorThankYouEmail(donorInfo) {
  try {
    // Send donor thank-you email
    // Takes in donorInfo object with "email", "firstName" fields
    const msg = {
      to: (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") ? ["duet.giving@gmail.com", donorInfo.email] : "duet.giving@gmail.com",
      from: "duet@giveduet.org",
      templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
      dynamic_template_data: {
        name: donorInfo.firstName,
        subject: (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") ? "Thank you from Duet" : "[SANDBOX] Thank you from Duet"
      }
    };

    await sgMail.sendMultiple(msg);
    console.log(`Donation confirmation sent ${donorInfo.email} to successfully.`);
  } catch (err) {
    errorHandler.handleError(error, "sendgridHelpers/sendDonorThankYouEmail");
  }
}

async function sendTypeformErrorEmail(typeformErrorInfo) {
  try {
    // Send error email if Typeform response can't get added to DB
    msg = {
      to: "duet.giving@gmail.com",
      from: "duet.giving@gmail.com",
      templateId: "d-6ecc5d7df32c4528b8527c248a212552",
      dynamic_template_data: {
        formTitle: typeformErrorInfo.formTitle,
        eventId: typeformErrorInfo.eventId,
        error: typeformErrorInfo.err
      }
    }
    await sgMail.send(msg);
    console.log("Sendgrid error message delived successfully.");
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendTypeformErrorEmail");
  }
}

async function sendStoreNotificationEmail(storeNotificationInfo) {
  try {
    // Send store notification email
    let subject;
    let recipientList;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'live') {
      subject = "Duet: The following items need your attention!";
      recipientList = ["duet.giving@gmail.com", storeNotificationInfo.email];
    } else {
      subject = "[SANDBOX] Duet: The following items need your attention!";
      recipientList = ["duet.giving@gmail.com"];
    }

    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: "d-435a092f0be54b07b5135799ac7dfb01",
      dynamic_template_data: {
        storeName: storeNotificationInfo.name,
        items: storeNotificationInfo.updatedItems,
        subject: subject
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Store notification email delivered to ${storeNotificationInfo.name} at ${storeNotificationInfo.email} successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendStoreNotificationEmail");
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
    errorHandler.handleError(err, "sendgridHelpers/sendStoreNotificationEmail");
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

async function sendItemStatusUpdateEmail(itemResult) {
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
        status: itemResult.status,
        itemId: itemResult.item_id,
        itemName: itemResult.item_name,
        itemSize: itemResult.size,
        itemLink: itemResult.item_photo_link,
        pickupCode: itemResult.pickup_code,
        refugeeName: `${itemResult.beneficiary_first} ${itemResult.beneficiary_last}`,
        refugeeId: itemResult.beneficiary_id,
        storeName: itemResult.store_name,
        donorName: `${itemResult.donor_first} ${itemResult.donor_last}`,
        donorEmail: itemResult.donor_email,
      }
    };
    await sgMail.send(msg);
    console.log(`Item status update message delivered to Duet successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendItemStatusUpdateEmail");
  }
}

async function sendItemPickedUpEmail(itemResult) {
  try {
    // Error checks
    if (!itemResult.donor_first) {
      throw new Error("Missing donor_first!");
    }
    if (!itemResult.donor_email) {
      throw new Error("Missing donor_email!");
    }
    // Get email template, family_image_url depending on whether beneficiary has family photo
    // TODO: implement Spence's design with family photo
    // var emailTemplateId, family_image_url;
    // var family_image_url;
    // if (itemResult.has_family_photo) {
    //   emailTemplateId = 'd-f309ea910a9a4b0a80fcf920ae48f075'; // family photo
    //   family_image_url = itemResult.family_image_url;
    // } else {
    //   emailTemplateId = 'd-2e5e32e85d614b338e7e27d3eacccac3'; // no family photo
    //   family_image_url = 'https://duet-web-assets.s3-us-west-1.amazonaws.com/Website+Assets/banner.png'; // Duet cover photo
    // }
    // Set subject, recipient list depending on environment
    const emailTemplateId = 'd-2e5e32e85d614b338e7e27d3eacccac3';
    let recipientList;
    let subject;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") {
      recipientList = [itemResult.donor_email, "duet.giving@gmail.com"];
      subject = "You've made a difference";
    } else {
      recipientList = ["duet.giving@gmail.com"];
      subject = "[SANDBOX] You've made a difference";
    }
    // Send message
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subject: subject,
        item_name: itemResult.item_name,
        item_link: itemResult.item_photo_link,
        donor_first: itemResult.donor_first,
        beneficiary_last: itemResult.beneficiary_last,
        beneficiary_link: (process.env.DUET_BENEFICIARIES_URL + '/' + itemResult.beneficiary_id),
        // family_image_url: family_image_url
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Item pickup message delivered successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendItemPickedUpEmail");
  }
}

export default {
  sendErrorEmail,
  sendTypeformErrorEmail,
  sendDonorThankYouEmail,
  sendStoreNotificationEmail,
  sendStorePaymentEmail,
  sendBalanceUpdateEmail,
  sendItemStatusUpdateEmail,
  sendItemPickedUpEmail,
};
