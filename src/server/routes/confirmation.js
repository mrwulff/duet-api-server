import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/confirmation", (req, res) => {
  controller.sendConfirmationEmail(req, res);
});

router.get("/status", (req, res) => {
  res.json({
    status: "ok"
  });
});

export default router;
