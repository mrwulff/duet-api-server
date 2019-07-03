import config from "./../util/config.js";
import sqlHelpers from "../util/sqlHelpers.js";
import errorHandler from "../util/errorHandler.js";

const conn = config.dbInitConnect();

async function login(req, res) {
  try {
    let email = req.body.email;
    if (email) {
      let storeResult = await sqlHelpers.getStoreInfoFromEmail(email);
      if (!storeResult) {
        res.status(400).send({ err: "Store email does not exist" });
      }
      else {
        res.status(200).send({
          storeId: storeResult["store_id"],
          name: storeResult["name"],
          email: storeResult["email"]
        });
      }
    } else {
      res.status(400).send({ err: "Missing email in request body " });
    }
  } catch (err) {
    errorHandler.handleError(err, "stores/login");
    res.status(500).send();
  }
}

export default { 
  login 
};