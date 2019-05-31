"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mysql = _interopRequireDefault(require("mysql2"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}
require("dotenv").config();

// will have to change these to env variables
var conn;
function dbInitConnect() {
  if (!conn) {
    conn = _mysql.default.createConnection({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE });

  }
  return conn;
}var _default =

{ dbInitConnect: dbInitConnect };exports.default = _default;