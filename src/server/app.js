global._babelPolyfill = false;

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

import express from "express";
import routes from "./routes/index";
import beneficiaryRoutes from "./routes/beneficiary";
import donateRoutes from "./routes/donate";
import itemsRoutes from "./routes/items";
import storeRoutes from "./routes/stores";
import currencyRoutes from "./routes/currency";
import recommendationRoutes from './routes/recommend';
import cors from "cors";
import bodyParser from "body-parser";
import { passport } from './util/auth.js';
import morgan from 'morgan';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging') {
  app.use(morgan('dev'));
}

// enable CORS
app.use(cors());

// enable passport
app.use(passport.initialize());

// enable cron jobs
require('./cronJobs/cronJobs')

app.use("/api", routes);

// beneficiary routes
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/refugee", beneficiaryRoutes);

// store routes
app.use("/api/stores", storeRoutes);

// donate routes
app.use("/api/donate", donateRoutes);

// item routes
app.use("/api/items", itemsRoutes);

// currency routes
app.use("/api/currency", currencyRoutes);

// recommendation routes
app.use("/api/recommend", recommendationRoutes);

export default app;
