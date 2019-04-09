import express from "express";
import controller from "./../controller/stores";

const router = express.Router();

router.post("/login", (req, res) => {
  controller.login(req, res);
});

export default router;