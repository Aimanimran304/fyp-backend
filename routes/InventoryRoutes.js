import express from "express";
import {
  getInventory,
  getLowStock,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  seedInventory,
} from "../controllers/inventoryController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Chef + Admin: read
router.get("/",     protect, getInventory);
router.get("/low",  protect, getLowStock);

// Admin only: write
router.post("/",        protect, isAdmin, addInventoryItem);
router.post("/seed",    protect, isAdmin, seedInventory);
router.patch("/:id",    protect, isAdmin, updateInventoryItem);
router.delete("/:id",   protect, isAdmin, deleteInventoryItem);

export default router;