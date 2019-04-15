import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/paid", (req, res) => {
  controller.itemPaid(req, res);
  controller.sendConfirmationEmail(req, res);
});

router.post("/testStoreownerConfirmationEmail", (req, res) => {
  controller.sendStoreownerNotificationEmail(req, res);
});

router.post("/testResponse", (req, res) => {
  res.status(200).send("hit endpoint successfully");
});

router.use("/testDBConnection", (req, res) => {
  var success = controller.testDBConnection(req, res);
});

router.use("/updateNotificationFlag", (req, res) => {
  var success = controller.updateNotificationFlag(req, res);
});

export default router;
