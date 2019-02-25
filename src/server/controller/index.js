import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./../config/config.js";

// store this in environment variable later
const secret = "secretkey";

function login(req, res) {
  console.log("getting token");
  // check if username and password match
  let username = req.body.username;
  let password = req.body.password;
  let conn = db.dbInitConnect();
  // check username in db and get stored password
  conn.execute(
    "SELECT refugee_id,fname,lname,password FROM refugees WHERE username=?",
    [username],
    function(err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else if (rows.length > 0) {
        let storedPassword = rows[0]["password"];
        // hash password to check with stored password
        bcrypt.compare(password, storedPassword, function(err, result) {
          if (result) {
            // generate and return token
            let token = jwt.sign({}, secret, {
              expiresIn: 50000
            });
            res.status(200).send({
              auth: true,
              token: token,
              user_id: rows[0]["refugee_id"],
              fname: rows[0]["fname"],
              lname: rows[0]["lname"]
            });
          } else {
            res.status(400).send({ message: "Invalid Password" });
          }
        });
      }
    }
  );
}

function createUser(req, res) {
  let body = req.body;
  let conn = db.dbInitConnect();
  conn.execute(
    "INSERT INTO addresses (street_name) VALUES (?)",
    [body.address],
    function(err) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else {
        // get index of last inserted entry
        conn.execute("SELECT LAST_INSERT_ID()", function(err, rows) {
          if (err) {
            console.log(err);
            res.status(500).send({ error: err });
          } else {
            let addressId = rows[0]["LAST_INSERT_ID()"];
            // hash password
            bcrypt.hash(body.password, 10, function(err, hash) {
              if (err) {
                console.log(err);
                res.status(500).send({ error: err });
              } else {
                // insert into db
                conn.execute(
                  "INSERT INTO refugees (fname,lname,phone_number,address_id,username,password) VALUES (?,?,?,?,?,?)",
                  [
                    body.fname,
                    body.lname,
                    body.phone_number,
                    addressId,
                    body.username,
                    hash
                  ],
                  function(err) {
                    if (err) {
                      console.log(err);
                      res.status(500).send({ error: err });
                    } else {
                      // get the inserted id
                      conn.execute("SELECT LAST_INSERT_ID()", function(
                        err,
                        rows
                      ) {
                        if (err && rows.length < 1) {
                          console.log(err);
                          res.status(500).send({ error: err });
                        } else {
                          let token = jwt.sign({}, secret, {
                            expiresIn: 50000
                          });
                          res.status(201).send({
                            status: "User Created",
                            token: token,
                            username: body.username,
                            fname: body.fname,
                            lname: body.lname,
                            user_id: rows[0]["LAST_INSERT_ID()"]
                          });
                        }
                      });
                    }
                  }
                );
              }
            });
          }
        });
      }
    }
  );
}

export default { login, createUser };
