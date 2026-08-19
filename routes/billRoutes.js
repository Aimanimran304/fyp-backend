import express from "express";
import { getPendingBillRequests, updateBillStatus } from "../controllers/billRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/",           protect, roleMiddleware(["cashier", "admin"]), getPendingBillRequests);
router.patch("/:id/status", protect, roleMiddleware(["cashier", "admin"]), updateBillStatus);

export default router;
