"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mysql = _interopRequireDefault(require("mysql2"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// will have to change these to env variables
var conn;
function dbInitConnect() {
  if (!conn) {
    conn = _mysql.default.createConnection({
      host: "duet-db.cb9zdhamycaz.us-east-2.rds.amazonaws.com",
      port: "3306",
      user: "duet_admin",
      password: "twostepping",
      database: "duet_db" });

  }
  return conn;
}var _default =

{ dbInitConnect: dbInitConnect };exports.default = _default;