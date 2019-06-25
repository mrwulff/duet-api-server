// Imports
require("dotenv").config();
import config from '../util/config.js';

// Insert message into database
async function insertMessageIntoDB(message) {
    let source = message['source'];
    let sender = message['sender'];
    let recipient = message['recipient'];
    let content = message['content'];

    try {
        let conn = await config.dbInitConnectPromise();
        conn.execute(
            "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
            [source, sender, recipient, content]
            );
        console.log("Successfully inserted message into database: %j", message);
    } catch (err) {
        console.log("Error when inserting message into database: %j", message);
        console.log(err);
    } 
}

export default {
    insertMessageIntoDB
}