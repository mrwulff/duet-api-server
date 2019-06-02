import express from "express";
import controller from "./../controller/refugee";

const router = express.Router();
const app = express();

router.get("/needs", (req, res) => {
  controller.getNeeds(req, res);
});

router.post("/testUploadItemImageToS3", (req, res) => {
  controller.testUploadItemImageToS3(req, res);
});

// router.get("/family", (req, res) => {
//   controller.getFamilyInfo(req, res);
// });

export default router;
