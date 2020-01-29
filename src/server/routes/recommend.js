import express from "express";
import controller from "./../controller/recommend";
import { passport } from './../util/auth.js';

const router = express.Router();

router.post("/scores", passport.authenticate('basic', { session: false }), controller.getRecommendationScores);

router.get("/donorsNeedingEmail", passport.authenticate('basic', { session: false }), controller.getDonorsNeedingRecommendationEmail);

router.post("/sendRecommendationEmail", passport.authenticate('basic', { session: false }), controller.sendRecommendationEmail);

export default router;
