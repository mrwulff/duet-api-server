import mysql from "mysql2";

// will have to change these to env variables
let conn;
function dbInitConnect() {
  if (!conn) {
    conn = mysql.createConnection({
      host: "duet-db.cb9zdhamycaz.us-east-2.rds.amazonaws.com",
      port: "3306",
      user: "duet_admin",
      password: "twostepping",
      database: "duet_db"
    });
  }
  return conn;
}

export default { dbInitConnect };
