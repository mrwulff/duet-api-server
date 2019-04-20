import express from "express";
import controller from "./../controller/items";

const router = express.Router();

router.get("/", (req, res) => {
  controller.getItems(req, res);
});

router.post("/verify", (req, res) => {
  controller.verifyItems(req, res);
});

router.post("/updateItemStatus", (req, res) => {
  controller.updateItemStatus(req, res);
});

router.post("/pickup/ready", (req, res) => {
  controller.readyForPickup(req, res);
});

router.post("/pickup/confirmation", (req, res) => {
  controller.pickupConfirmation(req, res);
});

export default router;
