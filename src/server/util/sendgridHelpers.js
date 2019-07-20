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
      to: ["duet.giving@gmail.com", donorInfo.email],
      from: "duet@giveduet.org",
      templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
      dynamic_template_data: {
        name: donorInfo.firstName,
        subject: (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live") ? "Duet Donation Confirmation" : "[SANDBOX] Duet Donation Confirmation"
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
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === 'sandbox') {
      subject = "[SANDBOX] Duet: The following items need your attention!";
    } else {
      subject = "Duet: The following items need your attention!";
    }

    const msg = {
      to: storeNotificationInfo.recipientList,
      from: "duet@giveduet.org",
      templateId: "d-435a092f0be54b07b5135799ac7dfb01",
      dynamic_template_data: {
        storeName: storeNotificationInfo.name,
        items: storeNotificationInfo.updatedItems,
        subject: subject
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Message delivered to ${storeNotificationInfo.name} at ${storeNotificationInfo.email} successfully.`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendStoreNotificationEmail");
  }
}

async function sendItemStatusUpdateEmail(itemResult) {
  try {
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
        itemName: itemResult.name,
        itemSize: itemResult.size,
        itemLink: itemResult.link,
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
    // Send item status update email: PICKED_UP
    const emailTemplateId = 'd-2e5e32e85d614b338e7e27d3eacccac3';
    let recipientList;
    let subject;
    if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "sandbox") {
      recipientList = ["duet.giving@gmail.com"];
      subject = "[SANDBOX] You've made a difference";
    } else if (process.env.SENDGRID_NOTIFICATION_BEHAVIOR === "live" && itemResult.donor_email && itemResult.donor_first) {
      recipientList = [itemResult.donor_email, "duet.giving@gmail.com"];
      subject = "You've made a difference";
    } else {
      errorHandler.handleError("Unable to send itemPickedUpEmail! itemResult: " + JSON.stringify(itemResult), "sendgridHelpers/sendItemPickedUpEmail");
    }
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subject: subject,
        item_name: itemResult.name,
        item_link: itemResult.link,
        donor_first: itemResult.donor_first,
        beneficiary_last: itemResult.beneficiary_last
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
  sendItemStatusUpdateEmail,
  sendItemPickedUpEmail
}