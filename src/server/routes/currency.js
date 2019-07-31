import express from "express";
import controller from "./../controller/currency";

const router = express.Router();

router.get("/update", (req, res) => {
  controller.updateCurrencyRates(req, res);
});

router.get("/", (req, res) => {
  controller.getCurrencyRates(req, res);
});

export default router;
