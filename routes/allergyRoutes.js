import express from "express";
import {
  saveAllergyProfile,
  checkAllergyForItem
} from "../controllers/allergyController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  @route   POST /api/allergy
  @desc    Create or update allergy profile
  @access  Logged-in User
*/
router.post("/", authMiddleware, saveAllergyProfile);

/*
  @route   GET /api/allergy
  @desc    Get logged-in user's allergy profile
  @access  Logged-in User
*/
router.get("/", authMiddleware, saveAllergyProfile); // agar GET method alag ho to alag function

/*
  @route   POST /api/allergy/check
  @desc    Check if a menu item is allergic for user
  @access  Logged-in User
*/
router.post("/check", authMiddleware, checkAllergyForItem);

export default router;
