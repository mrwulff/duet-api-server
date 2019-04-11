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


router.post("/testStoreownerConfirmationEmail", (req, res) => {
  controller.sendStoreownerNotificationEmail(req, res);
});

router.post("/testResponse", (req, res) => {
  res.status(200).send("hit endpoint successfully");
});

router.use("/testDBConnection", (req, res) => {
  var success = controller.testDBConnection(req, res);
  
});

export default router;
