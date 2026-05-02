// models/Table.js
import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true
    },
    area: {
      type: String,
      enum: ["indoor", "terrace", "rooftop"],
      required: true
    },
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);