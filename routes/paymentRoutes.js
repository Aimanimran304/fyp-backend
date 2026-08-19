// routes/paymentRoutes.js
import express from "express";
import {
  initiatePayment,
  verifyPayment,
  processCardPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.post("/verify", protect, verifyPayment);
router.post("/card", protect, processCardPayment);

export default router;