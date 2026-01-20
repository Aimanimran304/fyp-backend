import mongoose from "mongoose";

const allergyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allergies: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    severityLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const AllergyProfile = mongoose.model(
  "AllergyProfile",
  allergyProfileSchema
);

export default AllergyProfile;
