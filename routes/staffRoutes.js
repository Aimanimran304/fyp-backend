import express from "express";
import {
  createStaff,
  getAllStaff,
  deleteStaff,
  toggleStaffStatus,
  staffLogin,
} from "../controllers/staffController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public: staff login ───────────────────────────────────────────
router.post("/login", staffLogin);

// ── Admin only ────────────────────────────────────────────────────
router.post("/",            protect, isAdmin, createStaff);
router.get("/",             protect, isAdmin, getAllStaff);
router.delete("/:id",       protect, isAdmin, deleteStaff);
router.patch("/:id/toggle", protect, isAdmin, toggleStaffStatus);

export default router;