import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true, trim: true },
    capacity:    { type: Number, default: 4 },

    status: {
      type: String,
      enum: ["available", "reserved", "occupied"],
      default: "available",
    },

    // Which waiter is currently responsible for this table
    assignedWaiter: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

    // The active dine-in order sitting at this table, if any
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    // Denormalized for quick display without populating the order/user every time
    customerName: { type: String, default: "" },
  },
  { timestamps: true }
);

const Table = mongoose.model("Table", tableSchema);
export default Table;
