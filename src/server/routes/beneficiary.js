import express from "express";
import beneficiaryController from "./../controller/beneficiary";
import fbController from "./../controller/fbMessenger";
import typeformController from "./../controller/typeform";

const router = express.Router();

router.get("/", beneficiaryController.getBeneficiary);
router.get("/needs", beneficiaryController.getBeneficiary);
router.get("/match", beneficiaryController.getBeneficiaryMatch);

router.get("/fb", fbController.fbAuth);
router.post("/fb", fbController.processFBMessage);

router.post("/fbTestPickupNotification", fbController.sendTestPickupNotification);

router.post("/typeformV4", typeformController.processTypeformV4);

router.get("/:idOrUsername", beneficiaryController.getBeneficiary);

// router.post("/testUploadItemImageToS3", (req, res) => {
//   typeformController.testUploadItemImageToS3(req, res);
// });

// router.get("/family", (req, res) => {
//   controller.getFamilyInfo(req, res);
// });

export default router;
