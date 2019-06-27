import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/paid", (req, res) => {
  controller.itemPaid(req, res);
  //controller.sendConfirmationEmail(req, res);
});

router.post("/testStoreownerConfirmationEmail", (req, res) => {
  controller.sendStoreownerNotificationEmail(req, res);
});

router.post("/testResponse", (req, res) => {
  res.status(200).send("hit endpoint successfully");
});

export default router;
