import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
      required: true,
      lowercase: true,
      // example: pizza, burger, dessert
    },

    price: {
      type: Number,
      required: true,
    },

    ingredients: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    allergens: [
      {
        type: String,
        lowercase: true,
        trim: true,
        // example: milk, nuts, eggs
      },
    ],

    rating: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
