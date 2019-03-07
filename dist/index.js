"use strict";var _express = _interopRequireDefault(require("express"));
var _index = _interopRequireDefault(require("./routes/index"));
var _refugee = _interopRequireDefault(require("./routes/refugee"));
var _refugeeProtected = _interopRequireDefault(require("./routes/refugeeProtected"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var PORT = process.env.PORT || 8080;
var app = (0, _express.default)();

//app.use(express.urlencoded({ extended: true }));

app.use("/api", _index.default);

app.use("/api/refugee", _refugee.default);
//app.use("/api/refugee", requireAuth, refugeeProtectedRoutes);
app.use("/api/refugee", _refugeeProtected.default);

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
    _jsonwebtoken.default.verify(token, "secretkey", function (err, decoded) {
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