import bcrypt from "bcryptjs";
import jwt    from "jsonwebtoken";
import crypto from "crypto";
import User   from "../models/User.js";
import { sendOtpEmail } from "../utils/mailer.js";

// ─── Token helper ────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ─── REGISTER (customer only) ────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "customer", // ✅ hamesha customer — admin yahan se nahi banega
    });

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      token: generateToken(user._id),
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── LOGIN (customer only) ───────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ role: "customer" check — admin is route se login nahi kar sakta
    const user = await User.findOne({ email, role: "customer" });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email " });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── FORGOT PASSWORD: Step 1 — Send OTP ──────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Security: hamesha success bolo, chahe email exist na kare
    // (taake koi ye guess na kar sake ke konse emails registered hain)
    if (!user) {
      return res.json({
        success: true,
        message: "If this email exists, a reset code has been sent.",
      });
    }

    // 6-digit OTP generate karo
    const otp = crypto.randomInt(100000, 999999).toString();

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, user.name);
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(500).json({
        success: false,
        message: "Could not send reset email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "If this email exists, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── FORGOT PASSWORD: Step 2 — Verify OTP ────────────────────────────────────
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpiry");

    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    if (user.resetOtpExpiry < Date.now()) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "Code has expired. Please request a new one." });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect code" });
    }

    // ✅ OTP correct — ek short-lived reset token bana do taake
    // user seedhe resetPassword route hit na kar sake without verifying
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({ success: true, message: "Code verified", resetToken });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── FORGOT PASSWORD: Step 3 — Set New Password ──────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Reset session expired. Please start again." });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ success: false, message: "Invalid reset session" });
    }

    const user = await User.findById(decoded.id).select("+resetOtp +resetOtpExpiry");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};