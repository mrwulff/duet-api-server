// Imports
require("dotenv").config();
import config from '../util/config.js';
import errorHandler from './errorHandler.js';

// Insert message into database
async function insertMessageIntoDB(message) {
    let source = message['source'];
    let sender = message['sender'];
    let recipient = message['recipient'];
    let content = message['content'];

    try {
        let conn = await config.dbInitConnectPromise();
        conn.query(
            "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
            [source, sender, recipient, content]
            );
        console.log("Successfully inserted message into database: %j", message);
    } catch (err) {
        errorHandler.handleError(err, "sqlHelper/insertMessageIntoDB");
    } 
}

// Get all info necessary to send a pickup notification
async function getFBMessengerInfoFromItemId(itemId) {
    try {
        let conn = await config.dbInitConnectPromise();
        let [rows, fields] = await conn.query(
            "SELECT " +
                "items.name AS item_name, items.pickup_code, " +
                "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " +
                "stores.name AS store_name " +
                "FROM items " +
                "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " +
                "INNER JOIN stores ON items.store_id = stores.store_id " +
                "WHERE items.item_id=?",
                [itemId]
                );
        if (rows.length === 0) {
            console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);
            return null;
        }
        else {
            return rows[0];
        }
    } catch (err) {
        errorHandler.handleError(err, "sqlHelper/getFBMessengerInfoFromItemId");
    }
    
}

export default {
    insertMessageIntoDB,
    getFBMessengerInfoFromItemId
}