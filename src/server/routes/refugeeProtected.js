import express from "express";
import controller from "./../controller/refugee";

const router = express.Router();
const app = express();

router.post("/typeformV3", (req, res) => {
  controller.processTypeformV3(req, res);
});

router.post("/typeformV4", (req, res) => {
  controller.processTypeformV4(req, res);
});

export default router;
