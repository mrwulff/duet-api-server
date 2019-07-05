import express from "express";
import controller from "./../controller/index";

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({
    status: "ok"
  });
});

// router.post("/login", (req, res) => {
//   controller.login(req, res);
// });

// router.post("/signup", (req, res) => {
//   controller.createUser(req, res);
// });

export default router;
