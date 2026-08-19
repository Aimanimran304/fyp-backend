import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";

const todayStr = () => new Date().toISOString().split("T")[0];

// ─── Create Reservation — POST /api/reservations/create ──────────
export const createReservation = async (req, res) => {
  try {
    const { user, guestName, guests, tableNumber, date, time, area, specialRequest } = req.body;

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
      user:           user || null, // 🆕 matches your Step3 fix — sent directly in the body
    });

    await reservation.save();

    // 🔧 FIX: only touch the table if the reservation is for TODAY —
    // booking now for tomorrow must not block today's walk-ins.
    if (date === todayStr()) {
      await Table.findOneAndUpdate({ tableNumber }, { status: "reserved" });
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error("❌ Reservation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Reservations — GET /api/reservations (Admin) ────────
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

// ─── 🆕 Get My Reservations — GET /api/reservations/mine (Customer, JWT) ──
// Kept for if/when you add token auth to the reservation flow — works
// off the same `user` field. Not required for the polling fix below.
export const getMyReservations = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Please log in to view your reservations" });
    const reservations = await Reservation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 🆕 Get Single Reservation — GET /api/reservations/:id ────────
// Public (reservation IDs are unguessable Mongo ObjectIds, same trust
// model your app already uses for /create and /tables). This is what
// Step4 polls so a cancellation made in the Admin panel shows up on
// the customer's already-open success page, instead of only their
// stale localStorage cache.
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Reservation Status — PUT /:id/status (Admin only) ────
export const updateReservationStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["pending", "confirmed", "rejected", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const update = { status };
    if (["rejected", "cancelled"].includes(status)) {
      update.cancelReason = reason || "";
    }

    const reservation = await Reservation.findByIdAndUpdate(id, update, { new: true });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    await syncTableForReservation(reservation, status);

    res.json({ message: `Reservation ${status} successfully`, reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 🆕 Cancel My Reservation — PUT /api/reservations/:id/cancel ──
// Customer-safe version — your /:id/status route is admin-only, so
// the "Cancel Booking" button can't use it. This checks ownership by
// comparing the userId in the request body against the reservation's
// stored `user` field (same trust model as createReservation — no JWT
// required, matching how the rest of this flow already works).
export const cancelMyReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (!reservation.user || !userId || reservation.user.toString() !== String(userId)) {
      return res.status(403).json({ message: "You can only cancel your own reservations" });
    }
    if (["cancelled", "rejected", "completed"].includes(reservation.status)) {
      return res.status(400).json({ message: `This reservation is already ${reservation.status}` });
    }

    reservation.status = "cancelled";
    reservation.cancelReason = reason || "Cancelled by customer";
    await reservation.save();

    await syncTableForReservation(reservation, "cancelled");

    res.json({ message: "Reservation cancelled successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Shared table-sync logic used by both status-update paths ──────
async function syncTableForReservation(reservation, status) {
  const table = await Table.findOne({ tableNumber: reservation.tableNumber });
  if (!table) return;

  if (status === "confirmed" && reservation.date === todayStr()) {
    table.status = "reserved";
    await table.save();
  } else if (["rejected", "cancelled", "completed"].includes(status)) {
    if (table.status === "reserved") {
      table.status = "available";
      table.customerName = "";
      await table.save();
    }
  }
}

// ─── Delete Reservation — DELETE /:id (Admin) ─────────────────────
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const table = await Table.findOne({ tableNumber: reservation.tableNumber });
    if (table && table.status === "reserved") {
      table.status = "available";
      table.customerName = "";
      await table.save();
    }

    res.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Tables by Area — GET /tables ─────────────────────────────
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

// ─── Get Reservation Stats — GET /stats (Admin) ───────────────────
export const getReservationStats = async (req, res) => {
  try {
    const today = todayStr();

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