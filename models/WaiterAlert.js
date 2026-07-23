import mongoose from "mongoose";

const waiterAlertSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true },
    customerName: { type: String, default: "Customer" },
    message: { type: String, default: "Waiter ki zarurat hai" },
    isDismissed: { type: Boolean, default: false },
    dismissedAt: { type: Date },
    // Optional: link to order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

const WaiterAlert = mongoose.model("WaiterAlert", waiterAlertSchema);
export default WaiterAlert;