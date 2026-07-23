import express from "express";
import {
  getAlerts,
  createAlert,
  dismissAlert,
} from "../controllers/waiterAlertController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer: call waiter (protect — logged in customer)
router.post("/alerts", protect, createAlert);

// Waiter: see + dismiss alerts
router.get("/alerts",              protect, getAlerts);
router.patch("/alerts/:id/dismiss",protect, dismissAlert);

export default router;