import db from "./../config/config.js";

const conn = db.dbInitConnect();

function fulfillNeed(req, res) {
  let body = req.body;
  if (body.itemId) {
    // set item to fulfilled
    conn.execute(
      "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donor_phone,donation_amt_usd) " +
        " VALUES (NOW(),?,?,?,?,?)",
      [
        body.firstName,
        body.lastName,
        body.email,
        body.phoneNumber,
        body.amount
      ],
      function(err) {
        if (err) {
          console.log(err);
        } else {
          body.itemId.forEach(function(id) {
            // add entry into donations table
            conn.execute(
              "UPDATE items SET is_fulfilled=true,donation_id=SELECT LAST_INSERT_ID() WHERE item_id=?",
              [id],
              function(err) {
                if (err) {
                  console.log(err);
                } else {
                  res.status(200).send();
                }
              }
            );
          });
        }
      }
    );
  }
}

export default { fulfillNeed };
