import express from "express";
import typeformController from "./../controller/typeform";

const router = express.Router();
const app = express();

// router.post("/typeformV3", (req, res) => {
//   typeformController.processTypeformV3(req, res);
// });

router.post("/typeformV4", typeformController.processTypeformV4);

export default router;
