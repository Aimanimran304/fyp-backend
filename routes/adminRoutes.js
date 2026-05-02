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
  getAllReservations,
  updateReservationStatus,
} from "../controllers/adminController.js"; // ✅ sab ek jagah se

const router = express.Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
router.post("/login", adminLogin); // POST /api/admin/login

// ─── PROTECTED (admin only) — baaki sab routes ke liye ──────────────────────
router.use(protect, isAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Orders
router.get("/orders",          getAllOrders);
router.put("/orders/:id",      updateOrderStatus);

// Menu
router.get("/menu",               adminGetAllMenu);
router.post("/menu",              adminAddMenuItem);
router.put("/menu/:id",           adminUpdateMenuItem);
router.delete("/menu/:id",        adminDeleteMenuItem);
router.patch("/menu/:id/toggle",  adminToggleAvailability);

// Users
router.get("/users",        getAllUsers);
router.get("/users/:id",    getUserById);
router.delete("/users/:id", deleteUser);

// Reservations
router.get("/reservations",     getAllReservations);
router.put("/reservations/:id", updateReservationStatus);

export default router;