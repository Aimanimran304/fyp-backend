import express from "express";
import {
  createReservation,
  getReservations,
  getTables,
  deleteReservation,
  updateReservationStatus,  // NEW
  getReservationStats,      // NEW
} from "../controllers/reservationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── User / Public routes (same as before) ────────────────────────
router.post("/create",  createReservation);
router.get("/tables",   getTables);

// ── Admin routes (NEW) ────────────────────────────────────────────
router.get(   "/",            authMiddleware, roleMiddleware("admin"), getReservations);
router.get(   "/stats",       authMiddleware, roleMiddleware("admin"), getReservationStats);
router.put(   "/:id/status",  authMiddleware, roleMiddleware("admin"), updateReservationStatus);
router.delete("/:id",         authMiddleware, roleMiddleware("admin"), deleteReservation);

export default router;