import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      default: "",
    },
    specialRequest: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);