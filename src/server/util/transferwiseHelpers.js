// imports
import config from "../util/config.js";
import rp from 'request-promise';
import uuidv4 from 'uuid/v4';
import sendgridHelpers from "../util/sendgridHelpers.js";
import itemHelpers from "../util/itemHelpers.js";
import errorHandler from "../util/errorHandler.js";

async function getStoresNeedingBankTransfer() {
  // Returns a list containing bank transfer info for each store that we have to send a bank transfer to
  // TODO: create a 'payout' object type?
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "SELECT stores.name AS store_name, " +
      "stores.email AS store_email, " +
      "stores.iban AS iban, " +
      "payouts.payment_amount AS payment_amount, " +
      "payouts.item_ids AS item_ids " +
      "FROM stores " +
      "INNER JOIN (" +
      "SELECT store_id, " +
      "SUM(price_euros) AS payment_amount, " +
      "GROUP_CONCAT(item_id) AS item_ids " +
      "FROM items_view " +
      "WHERE status = 'PAID' AND bank_transfer_sent = 0 " +
      "GROUP BY store_id" +
      ") AS payouts " +
      "USING(store_id) " +
      "WHERE stores.payment_method = 'transferwise'",
    );
    return rows.map(singleStoreResult => ({
      ...singleStoreResult,
      item_ids: itemHelpers.itemIdsGroupConcatStringToNumberList(singleStoreResult.item_ids)
    }));
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/getStoresNeedingBankTransfer");
    throw err;
  }
}

async function setBankTransferSentFlagForItemIds(itemIds) {
  try {
    const conn = await config.dbInitConnectPromise();
    const [rows, fields] = await conn.query(
      "UPDATE items " +
      "SET bank_transfer_sent = 1 " +
      "WHERE item_id IN (?)",
      [itemIds]
    );
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/setBankTransferSentFlagForItemIds");
    throw err;
  }
}

async function getProfileId() {
  try {
    const profileInfo = await rp({
      uri: process.env.TRANSFERWISE_API + "/v1/profiles",
      headers: {
        Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
      },
      json: true
    });
    const personalProfile = profileInfo.find(profile => profile.type === "personal");
    const profileId = personalProfile.id;
    return profileId;
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/getProfileId");
    throw err;
  }
}

async function getEuroBalanceInfo(profileId) {
  try {
    const response = await rp({
      uri: process.env.TRANSFERWISE_API + "/v1/borderless-accounts",
      headers: {
        Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
      },
      qs: {
        profileId: profileId
      },
      json: true
    });
    const duetProfile = response.find(profile => profile.profileId === profileId);
    const eurBalance = duetProfile.balances.find(balance => balance.currency === "EUR");
    return eurBalance;
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/getEuroBalanceInfo");
    throw err;
  }
}

async function createEuroQuote(profileId, targetAmount) {
  try {
    const response = await rp({
      method: 'POST',
      uri: process.env.TRANSFERWISE_API + "/v1/quotes",
      headers: {
        "Authorization": `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: {
        profile: profileId,
        source: "EUR",
        target: "EUR",
        rateType: "FIXED",
        targetAmount: targetAmount,
        type: 'BALANCE_PAYOUT'
      },
      json: true
    });
    const fee = response.fee;
    const sourceAmount = response.sourceAmount;
    console.log(`Created quote for ${targetAmount}€. Fee: ${fee}. Source amount: ${sourceAmount}`);
    return response.id;
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/createEuroQuote");
    throw err;
  }
}

async function createRecipientAccount(storeName, currency, iban) {
  try {
    const response = await rp({
      method: 'POST',
      uri: process.env.TRANSFERWISE_API + "/v1/accounts",
      headers: {
        "Authorization": `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: {
        currency: currency,
        accountHolderName: storeName,
        legalType: 'BUSINESS',
        type: "IBAN",
        details: {
          iban: iban
        }
      },
      json: true
    });
    return response.id;
  }
  catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/createRecipientAccount");
    throw err;
  }
}

async function createTransfer(targetAccount, quoteId, customerTransactionId, reference = "From Duet") {
  try {
    const response = await rp({
      method: 'POST',
      uri: process.env.TRANSFERWISE_API + "/v1/transfers",
      headers: {
        "Authorization": `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: {
        targetAccount: targetAccount,
        quote: quoteId,
        customerTransactionId: customerTransactionId,
        details: {
          reference: reference
        }
      },
      json: true
    });
    return response.id;
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/createTransfer");
    throw err;
  }
}

async function fundTransfer(transferId) {
  try {
    const response = await rp({
      method: 'POST',
      uri: process.env.TRANSFERWISE_API + "/v1/transfers/" + transferId + "/payments",
      headers: {
        "Authorization": `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: {
        type: "BALANCE"
      },
      json: true
    });
    return response;
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/fundTransfer");
    throw err;
  }
}

// async function getDeliveryEstimate(transferId) {
//   try {
//     var response = await rp({
//       method: 'GET',
//       uri: process.env.TRANSFERWISE_API + "/v1/delivery-estimates/" + transferId,
//       headers: {
//         "Authorization": `Bearer ${process.env.TRANSFERWISE_API_KEY}`,
//       },
//       json: true
//     });
//   } catch (err) {
//     errorHandler.handleError(err, "transferwiseHelpers/getDeliveryEstimate");
//     throw err;
//   }
// }

// send transfer to one store
async function sendBankTransfer(storeName, iban, amount, recipientCurrency) {
  try {
    const uuid = uuidv4();
    const profileId = await getProfileId();
    // check for sufficient balance before proceeding
    const eurBalanceInfo = await getEuroBalanceInfo(profileId);
    const availableEur = eurBalanceInfo.amount.value;
    if (availableEur < amount) {
      throw new Error(`Insufficient balance in TransferWise EUR account! Available: ${availableEur}. Transfer amt: ${amount}`);
    }
    const quoteId = await createEuroQuote(profileId, amount);
    const recipientId = await createRecipientAccount(storeName, recipientCurrency, iban);
    const transferId = await createTransfer(recipientId, quoteId, uuid);
    const fundingResponse = await fundTransfer(transferId);
    console.log(`Successfully sent payment of ${amount}€ to ${storeName}! Payment UUID: ${uuid}. Transfer Id: ${transferId}`);
    return transferId;
  }
  catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/sendBankTransfer");
    throw err;
  }
}

async function sendTransferwiseEuroBalanceUpdateEmail() {
  try {
    const profileId = await getProfileId();
    const eurBalanceInfo = await getEuroBalanceInfo(profileId);
    const availableEur = eurBalanceInfo.amount.value;
    let subjectTag;
    if (availableEur <= Number(process.env.TRANSFERWISE_LOW_BALANCE_THRESHOLD)) {
      subjectTag = "WARNING";
      errorHandler.raiseWarning(`WARNING - sendTransferwiseEuroBalanceUpdateEmail: Low Transferwise EUR balance of ${availableEur}€!`);
    } else {
      subjectTag = "INFO";
    }
    sendgridHelpers.sendBalanceUpdateEmail("Transferwise", "EUR", availableEur, subjectTag);
  }
  catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/sendTransferwiseEuroBalanceUpdateEmail");
    throw err;
  }
}

async function setTransferwiseTransferIdForItemIds(transferId, itemIds) {
  try {
    const conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET transferwise_transfer_id=? WHERE item_id IN (?)",
      [transferId, itemIds]
    );
    console.log(`Successfully set transferwise_transfer_id to ${transferId} for itemIds: ${itemIds}`);
  } catch (err) {
    errorHandler.handleError(err, "transferwiseHelpers/setTransferwiseTransferIdForItemIds");
    throw err;
  }
}

export default {
  getStoresNeedingBankTransfer,
  setBankTransferSentFlagForItemIds,
  sendBankTransfer,
  sendTransferwiseEuroBalanceUpdateEmail,
  setTransferwiseTransferIdForItemIds
};
