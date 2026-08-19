import Table from "../models/Table.js";

// ─── GET /api/tables — Admin/Manager: all tables ─────────────────
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find()
      .populate("assignedWaiter", "name email")
      .populate("currentOrder", "totalAmount status")
      .sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/tables/mine — Waiter: tables assigned to me ────────
export const getMyTables = async (req, res) => {
  try {
    const tables = await Table.find({ assignedWaiter: req.user._id })
      .populate("currentOrder", "totalAmount status items")
      .sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── POST /api/tables — Admin: create a table ────────────────────
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;
    if (!tableNumber) return res.status(400).json({ message: "tableNumber is required" });

    const exists = await Table.findOne({ tableNumber });
    if (exists) return res.status(400).json({ message: "Table already exists" });

    const table = await Table.create({ tableNumber, capacity: capacity || 4 });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/tables/:id/assign — Admin: assign a waiter ───────
export const assignWaiter = async (req, res) => {
  try {
    const { waiterId } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    table.assignedWaiter = waiterId || null;
    await table.save();
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/tables/:id/status — Waiter/Admin: update status ──
export const updateTableStatus = async (req, res) => {
  try {
    const { status, customerName, currentOrder } = req.body;
    const allowed = ["available", "reserved", "occupied"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (status) table.status = status;
    if (customerName !== undefined) table.customerName = customerName;
    if (currentOrder !== undefined) table.currentOrder = currentOrder;
    // Clearing a table (back to available) also clears its order/customer
    if (status === "available") {
      table.customerName = "";
      table.currentOrder = null;
    }

    await table.save();
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE /api/tables/:id — Admin ──────────────────────────────
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json({ success: true, message: "Table removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
