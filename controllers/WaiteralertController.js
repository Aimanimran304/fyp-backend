import WaiterAlert from "../models/WaiterAlert.js";
import { notify } from "../utils/notify.js";

// ─── POST /api/waiter/assistance — Customer or Waiter: raise a request ──
// Open to both a logged-in customer (self-service "Call Waiter" from the
// table) and a waiter creating one on a guest's behalf.
export const createAlert = async (req, res) => {
  try {
    const { tableNumber, type, priority, notes } = req.body;
    const validTypes = ["water", "tissue", "spoon", "sauce", "bill", "complaint", "general"];

    if (!tableNumber || !type) {
      return res.status(400).json({ message: "tableNumber and type are required" });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${validTypes.join(", ")}` });
    }

    const alert = await WaiterAlert.create({
      tableNumber,
      type,
      priority: priority || (type === "complaint" ? "high" : "normal"),
      notes: notes || "",
      requestedBy: req.user?.role === "customer" ? req.user._id : null,
    });

    await notify({
      role: "waiter",
      type: "assistance_request",
      message: `Table ${tableNumber} needs assistance: ${type}`,
      relatedAlert: alert._id,
    });

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/waiter/assistance — Waiter: view requests ──────────
export const getAlerts = async (req, res) => {
  try {
    const alerts = await WaiterAlert.find({ status: { $ne: "completed" } })
      .sort({ priority: -1, createdAt: 1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/waiter/assistance/:id — Waiter: Accept / Complete ──
export const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "in-progress", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const alert = await WaiterAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Request not found" });

    alert.status = status;
    if (status === "in-progress") alert.assignedWaiter = req.user._id;
    await alert.save();

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
