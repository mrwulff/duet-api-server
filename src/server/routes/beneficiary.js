import express from "express";
import beneficiaryController from "./../controller/beneficiary";
import fbController from "./../controller/fbMessenger";
import typeformController from "./../controller/typeform";
import { passport } from './../util/auth.js';

const router = express.Router();

// beneficiary login
router.post("/login", beneficiaryController.login);

// beneficiary info routes
router.get("/", beneficiaryController.getBeneficiary);
router.get("/needs", beneficiaryController.getBeneficiary);
router.get("/match", beneficiaryController.getBeneficiaryMatch);

// facebook routes
router.get("/fb", fbController.fbAuth);
router.post("/fb", fbController.processFBMessage);

// typeform routes
router.post("/typeformV4", typeformController.processTypeformV4);

// protected routes
router.get("/scores", passport.authenticate('basic', { session: false }), beneficiaryController.getBeneficiaryScores);
router.post("/makeAnnouncement", passport.authenticate('basic', { session: false }), beneficiaryController.makeFBAnnouncement);

// dynamic routes
router.get("/:idOrUsername", beneficiaryController.getBeneficiary);

// ---------- TEST ROUTES ---------- //
// router.post("/fbTestPickupNotification", fbController.sendTestPickupNotification);

// router.post("/testUploadItemImageToS3", (req, res) => {
//   typeformController.testUploadItemImageToS3(req, res);
// });

export default router;
