import express from "express";
import controller from "./../controller/donate";

const router = express.Router();

router.post("/paid", controller.itemPaid);

export default router;
