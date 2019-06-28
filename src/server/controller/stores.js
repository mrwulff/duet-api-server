import config from "./../util/config.js";

const conn = config.dbInitConnect();

function login(req, res) {
  let email = req.body.email;

  if (email) {
    conn.execute(
      "SELECT store_id, name, email FROM stores WHERE email=?",
      [email],
      function(err, rows) {
        if (err) {
          console.log(err);
          res.status(500).send({ err: err });
        } else if (rows.length > 0) {
          res.status(200).send({
            storeId: rows[0]["store_id"],
            name: rows[0]["name"],
            email: rows[0]["email"]
          });
        } else {
          res.status(400).send({ err: "Store email does not exist"})
        }
      }
    );
  } else {
    res.status(400).send({ err: "Missing email in request body "});
  }
}

export default { login } ;