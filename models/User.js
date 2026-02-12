import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,   // 🔥 important
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,     // 🔥 security
    },
    role: {
      type: String,
      enum: ["Admin", "Customer", "Chef"],
      default: "Customer",
    },
    allergyProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AllergyProfile",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
