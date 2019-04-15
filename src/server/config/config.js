import mysql from "mysql2";
require("dotenv").config();

// will have to change these to env variables
let conn;
function dbInitConnect() {
  if (!conn) {
    conn = mysql.createConnection({
      host: "duet-db.cb9zdhamycaz.us-east-2.rds.amazonaws.com",
      port: "3306",
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE
    });
  }
  return conn;
}

export default { dbInitConnect };
