import express from "express";
import controller from "./../controller/donate";
import { passport } from './../util/auth.js';

const router = express.Router();

router.get("/", controller.getDonation);
router.post("/verifyTransaction", controller.verifyNewTransaction);
router.post("/cancelTransaction", controller.cancelTransaction);
router.post("/paid", controller.processSuccessfulTransaction); //TODO: phase this out later

router.post("/chargeTransaction", controller.chargeTransaction);
router.post("/processTransaction", controller.processSuccessfulTransaction);

// router.post("/createPayPalSubscription", controller.createPayPalSubscription);
router.post("/subscribe", controller.createSubscription);

// protected routes
router.post("/sendDonationConfirmationEmail", passport.authenticate('basic', { session: false }), controller.sendDonationConfirmationEmail);

export default router;
