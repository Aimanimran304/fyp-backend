import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";
import {
  getKitchenOrders,
  getLiveOrders,
  updateOrderStatus,
} from "../controllers/orderExtensions.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Customer ──────────────────────────────────────────────────────
router.post("/",    protect, placeOrder);
router.get("/",     protect, getMyOrders);

// ── Staff (specific routes PEHLE, /:id baad mein) ─────────────────
router.get("/kitchen", protect, getKitchenOrders);   // Chef
router.get("/live",    protect, getLiveOrders);       // Waiter
router.patch("/:id/status", protect, updateOrderStatus); // Chef + Waiter

// ── Customer: single order ────────────────────────────────────────
router.get("/:id",  protect, getOrderById);

export default router;