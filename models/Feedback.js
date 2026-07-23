// models/Feedback.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // ek order par sirf ek hi feedback allow hoga
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Denied"],
      default: "Pending",
    },
    denial_reason: {
      type: String,
      enum: [
        "Spam content",
        "Offensive or abusive language",
        "Fake review",
        "Irrelevant comment",
        "Duplicate feedback",
        "Inappropriate content",
        "Other",
      ],
      default: null,
    },
    denial_note: {
      // agar admin "Other" select kare to custom text yahan
      type: String,
      default: "",
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewed_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt = submission date
);

export default mongoose.model("Feedback", feedbackSchema);