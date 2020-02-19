import express from "express";
import controller from "./../controller/donate";
import { passport } from './../util/auth.js';

const router = express.Router();

router.get("/", controller.getDonation);

router.post("/captureTransaction", controller.captureTransaction);

// TODO: deprecate all these
router.post("/verifyTransaction", controller.verifyNewTransaction);
router.post("/cancelTransaction", controller.cancelTransaction);
router.post("/chargeTransaction", controller.chargeTransaction);
router.post("/processTransaction", controller.processSuccessfulTransaction);

// router.post("/createPayPalSubscription", controller.createPayPalSubscription);
router.post("/subscribe", controller.createSubscription);

// webhook for successful subscription invoice payments
router.post("/stripeWebhook", controller.handleStripeWebhook);

// protected routes
router.post("/sendDonationConfirmationEmail", passport.authenticate('basic', { session: false }), controller.sendDonationConfirmationEmail);

export default router;
