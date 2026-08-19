import express from "express";
import {
  createReservation,
  getReservations,
  getTables,
  deleteReservation,
  updateReservationStatus,
  getReservationStats,
  getMyReservations,     // kept for future JWT-based use
  getReservationById,    // 🆕
  cancelMyReservation,   // 🆕
} from "../controllers/reservationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── User / Public routes ──────────────────────────────────────────
router.post("/create",  createReservation);
router.get("/tables",   getTables);

// ── 🆕 Customer routes — no JWT required, matches your existing
//     body-based `user` linking (same trust model as /create) ──────
router.get("/mine", authMiddleware, getMyReservations); // available if you add token auth later
router.put("/:id/cancel", cancelMyReservation);          // ownership checked via body.userId

// ── Admin routes ───────────────────────────────────────────────────
router.get(   "/",            authMiddleware, roleMiddleware("admin"), getReservations);
router.get(   "/stats",       authMiddleware, roleMiddleware("admin"), getReservationStats);
router.put(   "/:id/status",  authMiddleware, roleMiddleware("admin"), updateReservationStatus);
router.delete("/:id",         authMiddleware, roleMiddleware("admin"), deleteReservation);

// ── 🆕 Public single-reservation lookup — MUST be last among GETs
//     since it's a catch-all "/:id" pattern ──────────────────────
router.get("/:id", getReservationById);

export default router;