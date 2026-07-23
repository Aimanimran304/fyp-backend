import WaiterAlert from "../models/WaiterAlert.js";

// ─── GET /api/waiter/alerts — Waiter: get active alerts ──────────
export const getAlerts = async (req, res) => {
  try {
    const alerts = await WaiterAlert.find({ isDismissed: false }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── POST /api/waiter/alerts — Customer: call waiter ─────────────
export const createAlert = async (req, res) => {
  try {
    const { tableNumber, customerName, message, order } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required" });
    }

    // Dismiss any existing active alert for this table
    await WaiterAlert.updateMany(
      { tableNumber, isDismissed: false },
      { isDismissed: true, dismissedAt: new Date() }
    );

    const alert = await WaiterAlert.create({
      tableNumber,
      customerName: customerName || "Customer",
      message: message || "Waiter assistance needed",
      order,
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/waiter/alerts/:id/dismiss — Waiter: dismiss alert
export const dismissAlert = async (req, res) => {
  try {
    const alert = await WaiterAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.isDismissed = true;
    alert.dismissedAt = new Date();
    await alert.save();

    res.json({ success: true, message: "Alert dismissed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};