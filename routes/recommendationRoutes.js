import express from "express";
import { getRecommendations, cartHealthCheck } from "../controllers/recommendationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/recommendations — fetch personalized recommendations
router.get("/", protect, getRecommendations);

// POST /api/recommendations/cart-check — cart me item add karne se pehle check
router.post("/cart-check", protect, cartHealthCheck);

export default router;