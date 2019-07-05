"use strict";


var _express = _interopRequireDefault(require("express"));
var _index = _interopRequireDefault(require("./routes/index"));
var _refugee = _interopRequireDefault(require("./routes/refugee"));
var _refugeeProtected = _interopRequireDefault(require("./routes/refugeeProtected"));
var _donate = _interopRequireDefault(require("./routes/donate"));
var _items = _interopRequireDefault(require("./routes/items"));
var _stores = _interopRequireDefault(require("./routes/stores"));
var _currency = _interopRequireDefault(require("./routes/currency"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _cors = _interopRequireDefault(require("cors"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _currency2 = _interopRequireDefault(require("./controller/currency"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}global._babelPolyfill = false;require("babel-polyfill");

require('dotenv').config();

var PORT = process.env.PORT || 8080;
var app = (0, _express["default"])();

app.use(_express["default"].urlencoded({ extended: true }));
app.use(_bodyParser["default"].json());

// enable CORS
app.use((0, _cors["default"])());

app.use("/api", _index["default"]);

app.use("/api/refugee", _refugee["default"]);
//app.use("/api/refugee", requireAuth, refugeeProtectedRoutes);
app.use("/api/stores", _stores["default"]);
app.use("/api/refugee", _refugeeProtected["default"]);
app.use("/api/donate", _donate["default"]);
app.use("/api/items", _items["default"]);
app.use("/api/currency/update", _currency["default"]);
app.listen(PORT, function () {
  console.log("Please navigate to port ".concat(PORT));
});

// middleware for authenticating valid tokens
// endpoints defined after this are protected
function requireAuth(req, res, next) {
  console.log("checking token");
  // check header or url parameters or post parameters for token
  var token =
  req.body.token || req.query.token || req.headers["x-access-token"];
  // decode token
  if (token) {
    // verifies secret and checks exp
    _jsonwebtoken["default"].verify(token, "secretkey", function (err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token." });

      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: "No token provided." });

  }
}