import express from "express";
import controller from "./../controller/metrics";

const router = express.Router();

router.get("/", controller.getMetrics);

export default router;
