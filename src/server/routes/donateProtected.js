import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/sendDonationConfirmationEmail", controller.sendDonationConfirmationEmail);

export default router;
