import express from "express";
import controller from "./../controller/confirmation";

const router = express.Router();

router.post("/confirmation", (req, res) => {
  controller.sendConfirmationEmail(req, res);
});

export default router;