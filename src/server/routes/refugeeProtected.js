import express from "express";
import controller from "./../controller/refugee";

const router = express.Router();
const app = express();

router.post("/form-submit", (req, res) => {
  controller.postNeeds(req, res);
});

export default router;
