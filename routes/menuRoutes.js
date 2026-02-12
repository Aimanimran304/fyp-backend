import express from "express";
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/menuController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllMenuItems);
router.get("/:id", getMenuItemById);

// Admin routes
router.post("/", authMiddleware, roleMiddleware("Admin"), createMenuItem);
router.put("/:id", authMiddleware, roleMiddleware("Admin"), updateMenuItem);
router.delete("/:id", authMiddleware, roleMiddleware("Admin"), deleteMenuItem);

export default router;
