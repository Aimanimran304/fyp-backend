// Routes for AI-based food recommendations
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getRecommendations } from "../controllers/recommendationController.js";

const router = express.Router();

/*
  @route   GET /api/recommendations
  @desc    Get AI-based food recommendations for logged-in user
  @access  Private (Customer)
*/
router.get("/", authMiddleware, getRecommendations);

export default router;
