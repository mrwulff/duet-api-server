import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/fulfill", (req, res) => {
  controller.fulfillNeed(req, res);
});

router.post("/paid", (req, res) => {
  controller.itemPaid(req, res);
  controller.sendConfirmationEmail(req, res);
});

export default router;
