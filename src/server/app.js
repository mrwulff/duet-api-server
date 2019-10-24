global._babelPolyfill = false;

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

import express from "express";
import routes from "./routes/index";
import beneficiaryRoutes from "./routes/beneficiary";
import beneficiaryProtectedRoutes from "./routes/beneficiaryProtected";
import donateRoutes from "./routes/donate";
import itemsRoutes from "./routes/items";
import storeRoutes from "./routes/stores";
import currencyRoutes from "./routes/currency";
import cors from "cors";
import bodyParser from "body-parser";
import { passport } from './util/auth.js';
import morgan from 'morgan';

require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// enable CORS
app.use(cors());

// enable passport
app.use(passport.initialize());

app.use("/api", routes);

// beneficiary routes
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/refugee", beneficiaryRoutes);
app.use("/api/beneficiary", passport.authenticate('basic', { session: false }), beneficiaryProtectedRoutes);
app.use("/api/refugee", passport.authenticate('basic', { session: false }), beneficiaryProtectedRoutes);

// store routes
app.use("/api/stores", storeRoutes);

// donate routes
app.use("/api/donate", donateRoutes);

// item routes
app.use("/api/items", itemsRoutes);

// currency routes
app.use("/api/currency", currencyRoutes);

export default app;
