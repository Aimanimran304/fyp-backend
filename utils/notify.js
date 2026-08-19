import Notification from "../models/Notification.js";

/**
 * Create a role-broadcast notification. Never throws — a notification
 * failing to save should never block the action that triggered it
 * (e.g. an order being marked ready).
 */
export const notify = async ({ role, type, message, relatedOrder = null, relatedAlert = null }) => {
  try {
    await Notification.create({ role, type, message, relatedOrder, relatedAlert });
  } catch (err) {
    console.error("notify() failed:", err.message);
  }
};
