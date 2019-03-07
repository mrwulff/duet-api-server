import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/fulfill", (req, res) => {
  controller.fulfillNeed(req, res);
});

export default router;
