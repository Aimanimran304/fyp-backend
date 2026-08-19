import express from "express";
import {
  getAllTables, getMyTables, createTable,
  assignWaiter, updateTableStatus, deleteTable,
} from "../controllers/tableController.js";
import { protect } from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Specific routes BEFORE /:id ones
router.get("/mine", protect, roleMiddleware(["waiter"]), getMyTables);

router.get("/",  protect, roleMiddleware(["admin", "manager"]), getAllTables);
router.post("/", protect, roleMiddleware(["admin", "manager"]), createTable);

router.patch("/:id/assign", protect, roleMiddleware(["admin", "manager"]), assignWaiter);
router.patch("/:id/status", protect, roleMiddleware(["waiter", "admin", "manager"]), updateTableStatus);
router.delete("/:id", protect, roleMiddleware(["admin", "manager"]), deleteTable);

export default router;
