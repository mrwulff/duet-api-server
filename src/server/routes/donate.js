import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.get("/", controller.getDonation);
router.post("/verifyTransaction", controller.verifyNewTransaction);
router.post("/cancelTransaction", controller.cancelTransaction);
router.post("/paid", controller.processSuccessfulTransaction); //TODO: phase this out later

router.post("/chargeTransaction", controller.chargeTransaction);
router.post("/processTransaction", controller.processSuccessfulTransaction);



router.post("/createSubscription", controller.createSubscription);
router.post("/subscribe", controller.processSuccessfulSubscription);

export default router;
