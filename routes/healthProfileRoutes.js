import express from "express";
import {
  saveHealthProfile,
  getHealthProfile,
  deleteHealthProfile,
  getValidOptions,
} from "../controllers/healthProfileController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — login ki zaroorat nahi (dropdown options k liye)
router.get("/options", getValidOptions);

// Protected — login zaroori hai
router.post("/", protect, saveHealthProfile);
router.get("/", protect, getHealthProfile);
router.delete("/", protect, deleteHealthProfile);

export default router;