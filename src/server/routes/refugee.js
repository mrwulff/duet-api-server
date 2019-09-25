import express from "express";
import refugeeController from "./../controller/refugee";
import fbController from "./../controller/fbMessenger";
// import typeformController from "./../controller/typeform";

const router = express.Router();
const app = express();

router.get("/needs", refugeeController.getNeeds);
router.get("/match", refugeeController.getMatch);

router.get("/fb", fbController.fbAuth);
router.post("/fb", fbController.processFBMessage);

router.post("/fbTestPickupNotification", fbController.sendTestPickupNotification);

// router.post("/testUploadItemImageToS3", (req, res) => {
//   typeformController.testUploadItemImageToS3(req, res);
// });

// router.get("/family", (req, res) => {
//   controller.getFamilyInfo(req, res);
// });

export default router;
