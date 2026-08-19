import Order from "../models/Order.js";
import HealthProfile from "../models/HealthProfile.js";
import { notify } from "../utils/notify.js";

// ─── GET /api/orders/kitchen — Chef: active kitchen orders ───────
export const getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["placed", "confirmed", "preparing", "ready"] },
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 }); // oldest first

    // Attach customer health profile to each order
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const obj = order.toObject();
        if (order.user?._id) {
          const health = await HealthProfile.findOne({ user: order.user._id }).lean();
          if (health) {
            obj.customerHealth = {
              allergies: health.allergies || [],
              diseases: health.diseases || health.medicalConditions || [],
              dietaryPreference: health.dietaryPreference || health.dietType || "",
            };
          }
        }
        return obj;
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("getKitchenOrders error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/orders/live — Waiter: all non-cancelled orders ─────
export const getLiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $nin: ["cancelled"] },
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("getLiveOrders error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/orders/:id/status — Chef/Waiter: update status ───
// ─── PATCH /api/orders/:id/status — Chef/Waiter: update status ───
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["placed", "confirmed", "preparing", "ready", "delivered", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    // 🔔 Real-time broadcast — sab dashboards (admin/chef/waiter) sun lenge
    const populatedOrder = await Order.findById(order._id).populate("user", "name email");
    const io = req.app.get("io");
    io.emit("orderStatusUpdated", populatedOrder);

    // 🔔 Notify waiters when the kitchen marks an order Ready
    if (status === "ready") {
      await notify({
        role: "waiter",
        type: "order_ready",
        message: `Order for ${order.orderType === "dine-in" ? `Table ${order.tableNumber}` : order.orderType} is ready to serve`,
        relatedOrder: order._id,
      });
    }

    return res.json({ success: true, order: populatedOrder });
  } catch (err) {
    console.error("updateOrderStatus error:", err.message);
    if (res.headersSent) return;
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};