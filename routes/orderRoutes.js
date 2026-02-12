import express from "express";

import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
  @route   POST /api/orders
  @desc    Place new order
  @access  Customer
*/
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Customer"]),
  placeOrder
);

/*
  @route   GET /api/orders/my
  @desc    Get logged-in user's orders
  @access  Customer
*/
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["Customer"]),
  getMyOrders
);

/*
  @route   GET /api/orders
  @desc    Get all orders
  @access  Admin, Staff
*/
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Staff"]),
  getAllOrders
);

/*
  @route   PUT /api/orders/:id
  @desc    Update order status
  @access  Admin, Staff
*/
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Staff"]),
  updateOrderStatus
);

export default router;
