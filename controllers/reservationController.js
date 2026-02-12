import Reservation from "../models/Reservation.js";

// @desc    Create table reservation
// @route   POST /api/reservations
// @access  Customer
export const createReservation = async (req, res, next) => {
  try {
    const { date, time, guests, notes } = req.body;

    if (!date || !time || !guests) {
      return res.status(400).json({
        message: "Date, time and number of guests are required",
      });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      date,
      time,
      guests,
      notes,
      status: "Pending",
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's reservations
// @route   GET /api/reservations/my
// @access  Customer
export const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

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
    const reservations = await Reservation.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id
// @access  Admin / Staff
export const updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    reservation.status = status || reservation.status;
    await reservation.save();

    res.status(200).json({
      message: "Reservation status updated successfully",
      reservation,
    });
  } catch (error) {
    next(error);
  }
};
