import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  adminLogin,
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  adminGetAllMenu,
  adminAddMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  adminToggleAvailability,
  getAllUsers,
  getUserById,
  deleteUser,
  getUserHealthProfile,
  getAllReservations,
  updateReservationStatus,
} from "../controllers/adminController.js";

// ✅ Feedback (admin side) — same controller file used by customer-facing feedbackRoutes.js
import {
  getAllFeedbacksForAdmin,
  approveFeedback,
  denyFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.post("/login", adminLogin);

// ─── PROTECTED (admin only) ───────────────────────────────────────────────────
router.use(protect, isAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Orders
router.get("/orders",        getAllOrders);
router.put("/orders/:id",    updateOrderStatus);

// Menu
router.get("/menu",                adminGetAllMenu);
router.post("/menu",               adminAddMenuItem);
router.put("/menu/:id",            adminUpdateMenuItem);
router.delete("/menu/:id",         adminDeleteMenuItem);
router.patch("/menu/:id/toggle",   adminToggleAvailability);

// Users
router.get("/users",                      getAllUsers);
router.get("/users/:id",                  getUserById);
router.delete("/users/:id",               deleteUser);
router.get("/users/:id/health-profile",   getUserHealthProfile);  // ✅ health profile

// Reservations
router.get("/reservations",      getAllReservations);
router.put("/reservations/:id",  updateReservationStatus);

// ✅ Feedback
router.get("/feedback",              getAllFeedbacksForAdmin);   // ?status=Pending|Approved|Denied|All
router.put("/feedback/:id/approve",  approveFeedback);
router.put("/feedback/:id/deny",     denyFeedback);

export default router;