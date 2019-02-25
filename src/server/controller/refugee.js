import db from "./../config/config.js";

const conn = db.dbInitConnect();

function postNeeds(req, res) {
  let body = req.body;
  // insert entry into refugee (name -> fname, desc -> lname)
  // THIS WILL NEED TO BE MODIFIED LATER
  conn.execute(
    "INSERT INTO requests (refugee_id,name,donor_id) VALUES (?,?,2)",
    [body.user_id, body.desc],
    function(err) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else {
        console.log("inserted refugee need");
        res.status(200).send({ status: "ok" });
      }
    }
  );
}

function getNeeds(req, res) {
  // get name, address, and description of needs from db
  // NEED TO BE MODIFIED LATER ACCORDING TO CODE ABOVE
  conn.execute(
    "SELECT CONCAT(refugees.fname, ' ', refugees.lname) AS `name`, addresses.street_name AS address, requests.name AS `desc` " +
      "FROM refugees INNER JOIN addresses USING(address_id) INNER JOIN requests USING(refugee_id)",
    function(err, rows) {
      if (err) {
        console.log(err);
      }
      res.json(rows);
    }
  );
}

export default { postNeeds, getNeeds };
