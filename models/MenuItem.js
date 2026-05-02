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
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "fastfood",
        "desifood",
        "chinese",
        "starters",
        "desserts",
        "beverages",
        "seafood",
        "continental",
      ],
      lowercase: true,
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

    // ── Health-related fields ──────────────────────────────
    allergens: [
      {
        type: String,
        lowercase: true,
        trim: true,
        // milk, nuts, eggs, gluten, shellfish, soy, fish, sesame
      },
    ],

    isVegetarian: {
      type: Boolean,
      default: false,
    },

    isVegan: {
      type: Boolean,
      default: false,
    },

    isSpicy: {
      type: Boolean,
      default: false,
    },

    isGlutenFree: {
      type: Boolean,
      default: false,
    },

    isDairyFree: {
      type: Boolean,
      default: false,
    },

    calories: {
      type: Number, // per serving
    },

    // ── Nutrition info — recommendation k liye ────────────
    nutrition: {
      protein:  { type: Number, default: 0 }, // grams
      carbs:    { type: Number, default: 0 },
      fat:      { type: Number, default: 0 },
      fiber:    { type: Number, default: 0 },
      sugar:    { type: Number, default: 0 },
      sodium:   { type: Number, default: 0 }, // mg
    },

    // ── Health tags — AI recommendation k liye ────────────
    // "diabetes-friendly", "heart-healthy", "low-sodium",
    // "high-protein", "weight-loss", "kidney-friendly" etc
    healthTags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // ── Diseases jis mein avoid karna chahiye ─────────────
    notRecommendedFor: [
      {
        type: String,
        lowercase: true,
        trim: true,
        // "diabetes", "hypertension", "heart disease", "obesity"
      },
    ],

    // ── Diseases jis mein suitable hai ───────────────────
    recommendedFor: [
      {
        type: String,
        lowercase: true,
        trim: true,
        // "diabetes", "weight loss", "high protein diet"
      },
    ],

    // ── Display ───────────────────────────────────────────
    image: {
      type: String,
      default: "",
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    preparationTime: {
      type: Number, // minutes
      default: 20,
    },

    servingSize: {
      type: String,
      default: "1 serving",
    },

    // ── Dine-in / Online order ────────────────────────────
    availableFor: {
      type: [String],
      enum: ["dine-in", "online", "both"],
      default: ["both"],
    },
  },
  {
    timestamps: true,
  }
);

// ── Index for fast search ─────────────────────────────────────
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ healthTags: 1 });
menuItemSchema.index({ allergens: 1 });
menuItemSchema.index({ isAvailable: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;