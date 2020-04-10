import express from "express";
import campaignController from "./../controller/campaigns";

const router = express.Router();

// get all campaigns
router.get("/", campaignController.getCampaign);

// get campaign by handle
router.get("/:campaignHandle", campaignController.getCampaign);

export default router;
