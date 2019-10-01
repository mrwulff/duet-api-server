global._babelPolyfill = false;

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

import express from "express";
import routes from "./routes/index";
import refugeeRoutes from "./routes/refugee";
import refugeeProtectedRoutes from "./routes/refugeeProtected";
import donateRoutes from "./routes/donate";
import itemsRoutes from "./routes/items";
import storeRoutes from "./routes/stores";
import currencyRoutes from "./routes/currency";
import cors from "cors";
import bodyParser from "body-parser";
import { passport } from './util/auth.js';

require('dotenv').config();

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// enable CORS
app.use(cors());

// enable passport
app.use(passport.initialize());

app.use("/api", routes);

app.use("/api/refugee", refugeeRoutes);
app.use("/api/refugee", passport.authenticate('basic', { session: false }), refugeeProtectedRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/refugee", refugeeProtectedRoutes);
app.use("/api/donate", donateRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/currency", currencyRoutes);
app.listen(PORT, () => {
  console.log(`Please navigate to port ${PORT}`);
});
