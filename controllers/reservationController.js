import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";

// ─── Create Reservation ───────────────────────────────────────────
export const createReservation = async (req, res) => {
  try {
    const { guestName, guests, tableNumber, date, time, area, specialRequest } = req.body;

    const missing = [];
    if (!guestName)   missing.push("guestName");
    if (!guests)      missing.push("guests");
    if (!tableNumber) missing.push("tableNumber");
    if (!date)        missing.push("date");
    if (!time)        missing.push("time");

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    const tableExists = await Table.findOne({ tableNumber });
    if (!tableExists) {
      return res.status(400).json({ message: `Table ${tableNumber} does not exist` });
    }

    const existing = await Reservation.findOne({ tableNumber, date, time });
    if (existing) {
      return res.status(400).json({ message: "This table is already booked for selected date and time" });
    }

    const reservation = new Reservation({
      guestName:      String(guestName),
      guests:         Number(guests),
      tableNumber:    String(tableNumber),
      date:           String(date),
      time:           String(time),
      area:           area           || "",
      specialRequest: specialRequest || "",
      status:         "confirmed",
    });

    await reservation.save();
    await Table.findOneAndUpdate({ tableNumber }, { status: "occupied" });

    res.status(201).json(reservation);
  } catch (error) {
    console.error("❌ Reservation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Reservations (Admin) ─────────────────────────────────
export const getReservations = async (req, res) => {
  try {
    const { status, area, date } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (area)   filter.area   = area;
    if (date)   filter.date   = date;

    const reservations = await Reservation.find(filter).sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Reservation Status (Admin) ───────────────────────────
export const updateReservationStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "rejected", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Table status update
    if (status === "rejected" || status === "cancelled") {
      await Table.findOneAndUpdate({ tableNumber: reservation.tableNumber }, { status: "available" });
    }
    if (status === "confirmed") {
      await Table.findOneAndUpdate({ tableNumber: reservation.tableNumber }, { status: "occupied" });
    }

    res.json({ message: `Reservation ${status} successfully`, reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Reservation ───────────────────────────────────────────
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    await Table.findOneAndUpdate(
      { tableNumber: reservation.tableNumber },
      { status: "available" }
    );

    res.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Tables by Area ───────────────────────────────────────────
export const getTables = async (req, res) => {
  try {
    const { area } = req.query;
    const filter = area ? { area } : {};
    const tables = await Table.find(filter).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Reservation Stats (Admin Dashboard) ──────────────────────
export const getReservationStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [total, pending, confirmed, todayCount, totalGuests] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: "pending" }),
      Reservation.countDocuments({ status: "confirmed" }),
      Reservation.countDocuments({ date: today }),
      Reservation.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$guests" } } },
      ]),
    ]);

    res.json({
      total,
      pending,
      confirmed,
      todayCount,
      totalGuests: totalGuests[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};