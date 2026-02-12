import express from "express";

import {
  getUserProfile,
  updateUserProfile,
  addAllergyProfile,
  getAllergyProfile
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
  @route   GET /api/users/profile
  @desc    Get logged-in user profile
  @access  Private
*/
router.get("/profile", authMiddleware, getUserProfile);

/*
  @route   PUT /api/users/profile
  @desc    Update user profile
  @access  Private
*/
router.put("/profile", authMiddleware, updateUserProfile);

/*
  @route   POST /api/users/allergy
  @desc    Add or update allergy profile
  @access  Private
*/
router.post("/allergy", authMiddleware, addAllergyProfile);

/*
  @route   GET /api/users/allergy
  @desc    Get user allergy profile
  @access  Private
*/
router.get("/allergy", authMiddleware, getAllergyProfile);

/*
  @route   GET /api/users/admin-test
  @desc    Admin only route (for role testing)
  @access  Admin
*/
router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware(["Admin"]),
  (req, res) => {
    res.json({ message: "Admin access granted ✅" });
  }
);

export default router;
