import Reservation from "../models/Reservation.js";

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Customer
export const createReservation = async (req, res, next) => {
  try {
    const { date, time, guests } = req.body;

    if (!date || !time || !guests) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      date,
      time,
      guests,
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user reservations
// @route   GET /api/reservations/my
// @access  Customer
export const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      user: req.user._id,
    });

    res.status(200).json(reservations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Admin / Staff
export const getAllReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find().populate(
      "user",
      "name email"
    );

    res.status(200).json(reservations);
  } catch (error) {
    next(error);
  }
};
