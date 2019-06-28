import express from "express";
import refugeeController from "./../controller/refugee";
import fbController from "./../controller/fbMessenger";
import typeformController from "./../controller/typeform";

const router = express.Router();
const app = express();

router.get("/needs", (req, res) => {
  refugeeController.getNeeds(req, res);
});

router.get("/fb", (req, res) => {
  fbController.fbAuth(req, res);
});

router.post("/fb", (req, res) => {
  fbController.processFBMessage(req, res);
});

router.post("/fbTestPickupNotification", (req, res) => {
  fbController.sendTestPickupNotification(req, res);
});

router.post("/testUploadItemImageToS3", (req, res) => {
  typeformController.testUploadItemImageToS3(req, res);
});

// router.get("/family", (req, res) => {
//   controller.getFamilyInfo(req, res);
// });

export default router;
