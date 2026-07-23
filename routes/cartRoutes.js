import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/", authMiddleware, getCart);
router.post("/", authMiddleware, addToCart);
router.put("/", authMiddleware, updateCartItem);
router.delete("/:menuItemId", authMiddleware, removeItem);
router.delete("/", authMiddleware, clearCart);

export default router;