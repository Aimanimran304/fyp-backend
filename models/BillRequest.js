import mongoose from "mongoose";

const billRequestSchema = new mongoose.Schema(
  {
    order:       { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    waiter:      { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    tableNumber: { type: String, required: true },
    amount:      { type: Number, required: true },

    status: {
      type: String,
      enum: ["sent", "acknowledged", "paid"],
      default: "sent",
    },

    // Filled in by the Cashier once payment is taken
    paymentMethod: { type: String, default: "" },
    handledBy:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  },
  { timestamps: true }
);

const BillRequest = mongoose.model("BillRequest", billRequestSchema);
export default BillRequest;
