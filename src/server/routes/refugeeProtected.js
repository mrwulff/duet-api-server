import express from "express";
import refugeeController from "./../controller/refugee";

const router = express.Router();

router.get("/scores", refugeeController.getScores);

export default router;
