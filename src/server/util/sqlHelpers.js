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
        await conn.query(
            "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
            [source, sender, recipient, content]
            );
        console.log("Successfully inserted message into database: %j", message);
    } catch (err) {
        errorHandler.handleError(err, "sqlHelper/insertMessageIntoDB");
        throw err;
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
        throw err;
    }
}

async function insertDonationIntoDB(donationInfo) {
    // Insert donation info into DB, return insert ID
    let insertDonationQuery = "";
    let insertDonationValues = [];
    try {
        let conn = await config.dbInitConnectPromise();
        if (donationInfo.email) {
            insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
                " VALUES (NOW(),?,?,?,?,?,?,?)";
            insertDonationValues = [
                donationInfo.firstName,
                donationInfo.lastName,
                donationInfo.email,
                donationInfo.amount,
                donationInfo.bankTransferFee,
                donationInfo.serviceFee,
                donationInfo.country
            ]
        } else {
            insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
                " VALUES (NOW(),?,?,?,?,?,?)";
            insertDonationValues = [
                donationInfo.firstName,
                donationInfo.lastName,
                donationInfo.amount,
                donationInfo.bankTransferFee,
                donationInfo.serviceFee,
                donationInfo.country
            ]
        }
        let [results, fields] = await conn.execute(insertDonationQuery, insertDonationValues);
        console.log("Successfully entered donation into DB: %j", donationInfo);
        return results.insertId;
    } catch (err) {
        errorHandler.handleError(err, "sqlHelpers/insertDonationIntoDB");
        throw err;
    }
    
}

export default {
    insertMessageIntoDB,
    getFBMessengerInfoFromItemId,
    insertDonationIntoDB
}