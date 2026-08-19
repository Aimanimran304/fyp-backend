import Notification from "../models/Notification.js";

// ─── GET /api/waiter/notifications — role-scoped (uses req.user.role) ──
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ role: req.user.role })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/waiter/notifications/:id/read ────────────────────
export const markNotificationRead = async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!n) return res.status(404).json({ message: "Notification not found" });
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/waiter/notifications/read-all ────────────────────
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ role: req.user.role, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
