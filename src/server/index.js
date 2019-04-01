import express from "express";
import routes from "./routes/index";
import refugeeRoutes from "./routes/refugee";
import refugeeProtectedRoutes from "./routes/refugeeProtected";
import donateRoutes from "./routes/donate";
import confirmationRoutes from "./routes/confirmation";
import itemsRoutes from "./routes/items";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// enable CORS
app.use(cors());

app.use("/api", routes);

app.use("/api/refugee", refugeeRoutes);
//app.use("/api/refugee", requireAuth, refugeeProtectedRoutes);
app.use("/api/refugee", refugeeProtectedRoutes);
app.use("/api/donate", donateRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/confirmation", confirmationRoutes);

app.listen(PORT, () => {
  console.log(`Please navigate to port ${PORT}`);
});

// middleware for authenticating valid tokens
// endpoints defined after this are protected
function requireAuth(req, res, next) {
  console.log("checking token");
  // check header or url parameters or post parameters for token
  let token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, "secretkey", function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token."
        });
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
      message: "No token provided."
    });
  }
}
