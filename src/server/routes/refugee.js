import express from "express";
import controller from "./../controller/refugee";

const router = express.Router();
const app = express();

router.get("/needs", (req, res) => {
  controller.getNeeds(req, res);
});

export default router;
