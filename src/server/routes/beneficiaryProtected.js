import express from "express";
import beneficiaryController from "./../controller/beneficiary";

const router = express.Router();

router.get("/scores", beneficiaryController.getBeneficiaryScores);
router.post("/makeAnnouncement", beneficiaryController.makeFBAnnouncementToVisibleBeneficiaries);

export default router;
