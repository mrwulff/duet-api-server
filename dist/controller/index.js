"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// store this in environment variable later
var secret = "secretkey";

function login(req, res) {
  console.log("getting token");
  // check if username and password match
  var username = req.body.username;
  var password = req.body.password;
  var conn = _config.default.dbInitConnect();
  // check username in db and get stored password
  conn.execute(
  "SELECT refugee_id,fname,lname,password FROM refugees WHERE username=?",
  [username],
  function (err, rows) {
    if (err) {
      console.log(err);
      res.status(500).send({ err: err });
    } else if (rows.length > 0) {
      var storedPassword = rows[0]["password"];
      // hash password to check with stored password
      _bcryptjs.default.compare(password, storedPassword, function (err, result) {
        if (result) {
          // generate and return token
          var token = _jsonwebtoken.default.sign({}, secret, {
            expiresIn: 50000 });

          res.status(200).send({
            auth: true,
            token: token,
            user_id: rows[0]["refugee_id"],
            fname: rows[0]["fname"],
            lname: rows[0]["lname"] });

        } else {
          res.status(400).send({ err: "Invalid Password" });
        }
      });
    } else {
      res.status(400).send({ err: "Username Does Not Exist" });
    }
  });

}

function createUser(req, res) {
  var body = req.body;
  var conn = _config.default.dbInitConnect();
  conn.execute(
  "INSERT INTO addresses (street_name) VALUES (?)",
  [body.address],
  function (err) {
    if (err) {
      console.log(err);
      res.status(500).send({ error: err });
    } else {
      // get index of last inserted entry
      conn.execute("SELECT LAST_INSERT_ID()", function (err, rows) {
        if (err) {
          console.log(err);
          res.status(500).send({ error: err });
        } else {
          var addressId = rows[0]["LAST_INSERT_ID()"];
          // hash password
          _bcryptjs.default.hash(body.password, 10, function (err, hash) {
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
              hash],

              function (err) {
                if (err) {
                  console.log(err);
                  res.status(500).send({ error: err });
                } else {
                  // get the inserted id
                  conn.execute("SELECT LAST_INSERT_ID()", function (
                  err,
                  rows)
                  {
                    if (err && rows.length < 1) {
                      console.log(err);
                      res.status(500).send({ error: err });
                    } else {
                      var token = _jsonwebtoken.default.sign({}, secret, {
                        expiresIn: 50000 });

                      res.status(201).send({
                        status: "User Created",
                        token: token,
                        username: body.username,
                        fname: body.fname,
                        lname: body.lname,
                        user_id: rows[0]["LAST_INSERT_ID()"] });

                    }
                  });
                }
              });

            }
          });
        }
      });
    }
  });

}var _default =

{ login: login, createUser: createUser };exports.default = _default;