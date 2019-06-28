import mysql from "mysql2";
require("dotenv").config();

// will have to change these to env variables
let conn;
function dbInitConnect() {
  if (!conn) {
    conn = mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE,
      charset: 'utf8mb4_unicode_ci'
    });
  }
  return conn;
}

export default { dbInitConnect };
