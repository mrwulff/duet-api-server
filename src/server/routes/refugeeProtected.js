import express from "express";
import controller from "./../controller/refugee";

const router = express.Router();
const app = express();

router.post("/typeform", (req, res) => {
  controller.processTypeform(req, res);
});

export default router;
