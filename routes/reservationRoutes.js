import express from "express";

import {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
} from "../controllers/reservationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
  @route   POST /api/reservations
  @desc    Create table reservation
  @access  Customer
*/
router.post(
  "/",
  authMiddleware,
  roleMiddleware("Customer"),
  createReservation
);

/*
  @route   GET /api/reservations/my
  @desc    Get logged-in user's reservations
  @access  Customer
*/
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("Customer"),
  getMyReservations
);

/*
  @route   GET /api/reservations
  @desc    Get all reservations
  @access  Admin, Staff
*/
router.get(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "Staff"),
  getAllReservations
);

/*
  @route   PUT /api/reservations/:id
  @desc    Update reservation status
  @access  Admin, Staff
*/
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "Staff"),
  updateReservationStatus
);

export default router;
