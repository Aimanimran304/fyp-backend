// routes/feedbackRoutes.js
import express from "express";
import {
  submitFeedback,
  getMyFeedbacks,
  getPublicFeedbacks,
} from "../controllers/feedbackController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", protect, submitFeedback);
router.get("/mine", protect, getMyFeedbacks);

// Public route
router.get("/public", getPublicFeedbacks);

// Admin feedback routes ab routes/adminRoutes.js mein hain:
// GET  /api/admin/feedback
// PUT  /api/admin/feedback/:id/approve
// PUT  /api/admin/feedback/:id/deny

export default router;