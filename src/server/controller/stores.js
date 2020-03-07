// Imports
import storeHelpers from '../util/storeHelpers.js';
import transferwiseHelpers from '../util/transferwiseHelpers.js';
import errorHandler from "../util/errorHandler.js";

async function login(req, res) {
  try {
    const email = req.body.email;
    if (email) {
      const storeObj = await storeHelpers.getStoreObjFromStoreEmail(email);
      if (!storeObj) {
        return res.status(400).send({ err: "Store email does not exist" });
      }
      else {
        return res.status(200).send({
          storeId: storeObj.storeId,
          name: storeObj.storeName,
          email: storeObj.storeEmail
        });
      }
    } else {
      return res.status(400).send({ err: "Missing email in request body " });
    }
  } catch (err) {
    errorHandler.handleError(err, "stores/login");
    return res.status(500).send();
  }
}

async function sendBankTransfer(req, res) {
  try {
    let transferId;
    if (req.body.reference) {
      transferId = await transferwiseHelpers.sendBankTransfer(req.body.storeName, req.body.iban, req.body.amount, "EUR", req.body.reference);
    } else {
      transferId = await transferwiseHelpers.sendBankTransfer(req.body.storeName, req.body.iban, req.body.amount, "EUR");
    }
    console.log(`stores/sendBankTransfer: transfer successful (ID: ${transferId})`);
    res.status(200).send();
  } catch (err) {
    errorHandler.handleError(err, "stores/testSendBankTransfer");
    res.status(500).send();
  }
}

export default {
  // routes
  login,

  // test routes
  sendBankTransfer,
};
