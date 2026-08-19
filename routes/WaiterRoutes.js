import express from "express";
import { createAlert, getAlerts, updateAlertStatus } from "../controllers/waiterAlertController.js";
import { createBillRequest, getMyBillRequests } from "../controllers/billRequestController.js";
import { getMyNotifications, markNotificationRead, markAllRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── Customer Assistance ──────────────────────────────────────────
// POST is open to any logged-in role (customer calling for help, or a
// waiter logging a request on a guest's behalf).
router.post("/assistance",       protect, createAlert);
router.get("/assistance",        protect, roleMiddleware(["waiter"]), getAlerts);
router.patch("/assistance/:id",  protect, roleMiddleware(["waiter"]), updateAlertStatus);

// ── Bill Requests (Waiter → Cashier handoff) ─────────────────────
router.post("/bill-requests", protect, roleMiddleware(["waiter"]), createBillRequest);
router.get("/bill-requests",  protect, roleMiddleware(["waiter"]), getMyBillRequests);

// ── Notifications (role-scoped: waiter/chef/cashier/admin) ───────
router.get("/notifications",             protect, getMyNotifications);
router.patch("/notifications/:id/read",  protect, markNotificationRead);
router.patch("/notifications/read-all",  protect, markAllRead);

export default router;
