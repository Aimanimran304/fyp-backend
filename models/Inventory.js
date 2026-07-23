import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "liter", "ml", "pieces", "dozen", "pack", "bottle"],
      default: "pieces",
    },
    minimumStock: { type: Number, default: 10 },
    category: {
      type: String,
      enum: ["vegetables", "meat", "dairy", "beverages", "spices", "grains", "other"],
      default: "other",
    },
    supplier: { type: String, default: "" },
    pricePerUnit: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;