import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// ─── Existing routes ──────────────────────────────────────────────
router.post("/register", registerUser);
router.post("/login", loginUser);

// ─── Forget Password flow (3 steps) ──────────────────────────────
router.post("/forgot-password", forgotPassword);   // Step 1: email -> sends OTP
router.post("/verify-otp", verifyResetOtp);         // Step 2: email + otp -> resetToken
router.post("/reset-password", resetPassword);      // Step 3: resetToken + newPassword -> done

export default router;