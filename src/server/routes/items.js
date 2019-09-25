import express from "express";
import controller from "./../controller/items";

const router = express.Router();

router.get("/", controller.getItems);

router.post("/updateItemStatus", controller.updateItemStatus);

export default router;
