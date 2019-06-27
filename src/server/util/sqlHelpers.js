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

async function markItemAsDonated(itemId, donationId) {
    // Mark item as donated, note that it requires store notification
    try {
        let conn = await config.dbInitConnectPromise();
        await conn.query(
            "UPDATE items SET status='PAID', in_notification=1, donation_id=? WHERE item_id=?",
            [donationId, itemId]
            );
    } catch (err) {
        errorHandler.handleError(err, "sqlHelpers/markItemAsDoanted");
        throw err;
    }
}

async function getPayoutInfo(itemIds) {
    // Get stores' Payout info for list of items
    // Returns a list containing payout info for each store that we have to send a payout to
    try {
        let conn = await config.dbInitConnectPromise();
        let [rows, fields] = await conn.query("SELECT stores.paypal AS paypal, " +
            "payouts.payment_amount AS payment_amount, " +
            "payouts.item_ids AS item_ids " +
            "FROM stores AS stores " +
            "INNER JOIN (" +
            "SELECT store_id, " +
            "SUM(price_euros) AS payment_amount, " +
            "GROUP_CONCAT(item_id) AS item_ids " +
            "FROM items " +
            "WHERE item_id IN (?) " +
            "GROUP BY store_id" +
            ") AS payouts " +
            "USING(store_id) " +
            "WHERE stores.payment_method = 'paypal'",
            [itemIds]);
        // convert item_ids from string to list
        rows.forEach(singleStoreResult => {
            singleStoreResult.item_ids = singleStoreResult.item_ids.split(",");
        });
        return rows;
    } catch (err) {
        errorHandler.handleError(err, "sqlHelpers/getPayoutInfo");
        throw err;
    }
}

async function setStoreNotificationFlags(itemIds) {
    // Set store notification flag to 1 for all stores that interacdt with these items
    try {
        let conn = await config.dbInitConnectPromise();

        // Get list of all store IDs that need notification flag set
        let [storeIdResults, fields] = await conn.query(
            "SELECT store_id FROM items WHERE item_id IN (?)",
            [itemIds]);
        let storeIdsList = storeIdResults.map(storeIdResult => storeIdResult.store_id);

        // Set needs_notification to 1
        await conn.query(
            "UPDATE stores SET needs_notification=1 WHERE store_id IN (?)",
            [storeIdsList]);
        console.log(`Notification flag updated sucessfully for stores: ${storeIdsList}`)
    } catch (err) {
        errorHandler.handleError(err, "sqlHelpers/setStoreNotificationFlags");
        throw err;
    }
}

export default {
    insertMessageIntoDB,
    markItemAsDonated,
    getFBMessengerInfoFromItemId,
    insertDonationIntoDB,
    getPayoutInfo,
    setStoreNotificationFlags
}