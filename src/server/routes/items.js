import express from "express";
import controller from "./../controller/items";

const router = express.Router();

router.get("/", controller.getItems);

router.post("/updateItemStatus", controller.updateItemStatus);

router.post("/updateItemDonorMessage", controller.updateItemDonorMessage);

router.get("/:itemId", controller.getItems);

export default router;
