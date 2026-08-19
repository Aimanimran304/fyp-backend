import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Broadcast to a role rather than a single user — simplest fit for a
    // small restaurant floor (any waiter on shift can act on it).
    role: {
      type: String,
      enum: ["waiter", "chef", "cashier", "admin"],
      required: true,
    },

    type: {
      type: String,
      enum: ["order_assigned", "order_ready", "assistance_request", "bill_generated"],
      required: true,
    },

    message: { type: String, required: true },

    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    relatedAlert: { type: mongoose.Schema.Types.ObjectId, ref: "WaiterAlert", default: null },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
