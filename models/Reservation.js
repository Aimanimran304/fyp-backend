import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
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
      // ✅ "pending" add kiya — pehle missing tha, isliye actions kaam nahi kar rahe the
      enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);