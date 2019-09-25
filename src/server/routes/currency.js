import express from "express";
import controller from "./../controller/currency";

const router = express.Router();

router.get("/update", controller.updateCurrencyRates);

router.get("/", controller.getCurrencyRates);

export default router;
