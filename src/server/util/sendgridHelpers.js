import config from "../util/config.js";
import errorHandler from "../util/errorHandler.js";
import donationHelpers from "../util/donationHelpers.js";
import donorHelpers from "../util/donorHelpers.js";
import itemHelpers from "../util/itemHelpers.js";
import beneficiaryHelpers from "../util/beneficiaryHelpers.js";
import storeHelpers from "../util/storeHelpers.js";
const sgMail = config.sendgridInit(); // Sendgrid

const unsubGroupId = 11371; // Automated Donation Updates unsub group

async function sendDonorThankYouEmailV2(donationId) {
  try {
    // get necessary data
    const donationObj = await donationHelpers.getDonationObjFromDonationId(donationId);
    const beneficiaryId = donationObj.items[0].beneficiaryId; // NOTE: assume all items are from the same beneficiary
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryById(beneficiaryId, {withNeeds: false});
    // create sendgrid message
    const emailTemplateId = "d-fb8c05dc69cd4bcbae0bb47f3571ef7d";
    let subjectTag = "";
    let recipientList;
    if (process.env.NODE_ENV === "production") {
      recipientList = [donationObj.donor.donorEmail, "duet.giving@gmail.com"];
    } else {
      recipientList = ["duet.giving@gmail.com"];
      subjectTag = "[SANDBOX] ";
    }
    const donationTrackerUrl = `${process.env.DUET_WEBSITE}/donation?donationId=${donationObj.donationId}`;
    const beneficiaryPageUrl = `${process.env.DUET_WEBSITE}/give/${beneficiaryObj.username}`;
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        isToOnBehalfOfEmail: false,
        subjectTag: subjectTag,
        donation: {...donationObj, donationAmtUsd: donationObj.donationAmtUsd.toFixed(2)},
        beneficiary: beneficiaryObj,
        items: donationObj.items.map(itemObj => ({...itemObj, price: itemObj.price.toFixed(2)})),
        beneficiaryPageUrl: beneficiaryPageUrl,
        donationTrackerUrl: donationTrackerUrl,
      },
      asm: {
        groupId: unsubGroupId
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Donation thank you v2 message delivered successfully to ${recipientList}. donationTrackerUrl: ${donationTrackerUrl}`);
    
    // send email to person that the donation was made on behalf of
    if (donationObj.onBehalfOfEmail) {
      let subjectTag = "";
      let recipientList;
      if (process.env.NODE_ENV === "production") {
        recipientList = [donationObj.onBehalfOfEmail, "duet.giving@gmail.com"];
      } else {
        recipientList = ["duet.giving@gmail.com"];
        subjectTag = "[SANDBOX] ";
      }
      const msg = {
        to: recipientList,
        from: "duet@giveduet.org",
        templateId: emailTemplateId,
        dynamic_template_data: {
          isToOnBehalfOfEmail: true,
          subjectTag: subjectTag,
          donation: { ...donationObj, donationAmtUsd: donationObj.donationAmtUsd.toFixed(2) },
          beneficiary: beneficiaryObj,
          items: donationObj.items.map(itemObj => ({ ...itemObj, price: itemObj.price.toFixed(2) })),
          beneficiaryPageUrl: beneficiaryPageUrl,
          donationTrackerUrl: donationTrackerUrl,
        },
        asm: {
          groupId: unsubGroupId
        }
      };
      await sgMail.sendMultiple(msg);
      console.log(`Donation thank you v2 ("on behalf of") message delivered successfully to ${recipientList}. donationTrackerUrl: ${donationTrackerUrl}`);
    }
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendDonorThankYouEmailV2");
  }
}

async function sendSubscriptionThankYouEmail(subscription) {
  try {
    // get necessary data
    const {email, firstName, serviceFee, amount} = subscription.metadata;

    //const donationObj = await donationHelpers.getDonationObjFromDonationId(donationId);
    // create sendgrid message
    const emailTemplateId = "d-c2a1309bf95244d7834f3d25ba3d1f88";
    let subjectTag = "";
    let recipientList;
    if (process.env.NODE_ENV === "production") {
      recipientList = [email, "duet.giving@gmail.com"];
    } else {
      recipientList = ["duet.giving@gmail.com"];
      subjectTag = "[SANDBOX] ";
    }
    // e.g. 2019-11-19
    // multiply by 1000 since javascript counts in milliseconds since epoch
    const date = new Date(subscription.created * 1000); 
    const donationDate = date.getFullYear() + "-" + 
      (date.getMonth() + 1) + "-" + 
      date.getDate();
    
    const msg = {
      to: recipientList,
      from: "duet@giveduet.org",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subjectTag: subjectTag,
        donation: { 
          firstName, 
          donationAmtUsd: parseFloat(amount).toFixed(2),
          serviceFeeUsd: parseFloat(serviceFee).toFixed(2),
          donationTimestamp: donationDate,
        },
      },
      asm: {
        groupId: unsubGroupId
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Subscription thank you message delivered successfully to ${recipientList}. subscriptionId: ${subscription.id}`);
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendSubscriptionThankYouEmail");
  }
}

async function sendItemPickedUpEmailV2(itemId) {
  try {
    // get necessary objects
    const itemObj = await itemHelpers.getItemObjFromItemId(itemId);
    if (itemObj.status !== 'PICKED_UP') {
      throw new Error(`Attempted to call sendItemPickedUpEmailV2 on a non-picked up item: ${itemId}`);
    }
    const donationObj = await donationHelpers.getDonationObjFromDonationId(itemObj.donationId);
    const beneficiaryObj = await beneficiaryHelpers.getBeneficiaryById(itemObj.beneficiaryId, {withNeeds: false});
    const storeObj = await storeHelpers.getStoreObjFromStoreId(itemObj.storeId);
    // create sendgrid email
    let subjectTag = "";
    let recipientList;
    const emailTemplateId = "d-aa4552b94fd24480b073164e984c0483";
    if (process.env.NODE_ENV === "production") {
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
        isToOnBehalfOfEmail: false,
        subjectTag: subjectTag,
        item: { ...itemObj, price: itemObj.price.toFixed(2) },
        donor: donationObj.donor,
        beneficiary: beneficiaryObj,
        store: storeObj
      },
      asm: {
        groupId: unsubGroupId
      }
    };
    await sgMail.sendMultiple(msg);
    console.log(`Item pickup message V2 delivered successfully to ${recipientList}`);

    // If donation was made on behalf of someone else, then send the email to them too
    if (donationObj.onBehalfOfEmail) {
      // create sendgrid email
      let subjectTag = "";
      let recipientList;
      const emailTemplateId = "d-aa4552b94fd24480b073164e984c0483";
      if (process.env.NODE_ENV === "production") {
        recipientList = [donationObj.onBehalfOfEmail, "duet.giving@gmail.com"];
      } else {
        recipientList = ["duet.giving@gmail.com"];
        subjectTag = "[SANDBOX] ";
      }
      const msg = {
        to: recipientList,
        from: "duet@giveduet.org",
        templateId: emailTemplateId,
        dynamic_template_data: {
          isToOnBehalfOfEmail: true,
          subjectTag: subjectTag,
          item: { ...itemObj, price: itemObj.price.toFixed(2) },
          donor: {
            donorFirst: donationObj.onBehalfOfFirst,
            donorLast: donationObj.onBehalfOfLast,
            donorEmail: donationObj.onBehalfOfEmail
          },
          beneficiary: beneficiaryObj,
          store: storeObj
        },
        asm: {
          groupId: unsubGroupId
        }
      };
      await sgMail.sendMultiple(msg);
      console.log(`Item pickup message V2 ("on behalf of") delivered successfully to ${recipientList}`);
    }
  } catch (err) {
    errorHandler.handleError(err, "sendgridHelpers/sendItemPickedUpEmailV2");
  }
}

async function sendStoreItemVerificationEmail(storeObj, itemObjs) {
  try {
    // Send store notification email
    let subject;
    let recipientList;
    if (process.env.NODE_ENV === 'production') {
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
    if (process.env.NODE_ENV === 'production') {
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
    const env = (process.env.NODE_ENV === "production" ? "PROD" : "SANDBOX");
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
    if (process.env.NODE_ENV !== "staging" && process.env.NODE_ENV !== "production") {
      return;
    }
    // Send item status update email
    const emailTemplateId = 'd-15967181f418425fa3510cb674b7f580';
    const msg = {
      to: "duet.giving@gmail.com",
      from: "duet.giving@gmail.com",
      templateId: emailTemplateId,
      dynamic_template_data: {
        subject: (process.env.NODE_ENV === "production") ? "[PROD] - Item Status Update" : "[SANDBOX] - Item Status Update",
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

export default {
  // To donors
  sendDonorThankYouEmailV2,
  sendSubscriptionThankYouEmail,
  sendItemPickedUpEmailV2,

  // To stores
  sendStoreItemVerificationEmail,
  sendStorePaymentEmail,

  // Internal
  sendTypeformErrorEmail,
  sendItemStatusUpdateEmail,
  sendBalanceUpdateEmail,
};
