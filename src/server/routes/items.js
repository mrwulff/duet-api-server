import express from "express";
import controller from "./../controller/items";

const router = express.Router();

router.get("/", (req, res) => {
  controller.getItems(req, res);
});

router.post("/verify", (req, res) => {
  controller.verifyItems(req, res);
});

export default router;
