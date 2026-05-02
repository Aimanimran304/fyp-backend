import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name:     { type: String,  required: true },
        price:    { type: Number,  required: true },
        quantity: { type: Number,  required: true },
        image:    { type: String,  default: "" },
      },
    ],

    orderType: {
      type: String,
      enum: ["delivery", "takeaway", "dine-in"],
      required: true,
    },

    // ── Delivery info ──
    deliveryAddress: {
      street:  { type: String },
      city:    { type: String },
      phone:   { type: String },
    },

    // ── Dine-in info ──
    tableNumber: { type: String },
    guestCount:  { type: Number },

    // ── Payment ──
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "jazzcash", "easypaisa"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // ── Pricing ──
    subtotal:     { type: Number, required: true },
    deliveryFee:  { type: Number, default: 0     },
    tax:          { type: Number, default: 0     },
    totalAmount:  { type: Number, required: true },

    // ── Status ──
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "ready", "delivered", "cancelled"],
      default: "placed",
    },

    specialInstructions: { type: String, default: "" },

    estimatedTime: { type: Number, default: 30 }, // minutes
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;