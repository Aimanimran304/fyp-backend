import mongoose from "mongoose";

const waiterAlertSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["water", "tissue", "spoon", "sauce", "bill", "complaint", "general"],
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },

    // Who raised it — a logged-in customer (optional; guests can also trigger this
    // from the table-side "Call Waiter" button without an account)
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Which waiter accepted/is handling it
    assignedWaiter: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const WaiterAlert = mongoose.model("WaiterAlert", waiterAlertSchema);
export default WaiterAlert;
