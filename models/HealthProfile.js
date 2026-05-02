import mongoose from "mongoose";

// ─── Valid lists ────────────────────────────────────────────────
const VALID_ALLERGIES = [
  "Dairy", "Shellfish", "Soy", "Eggs", "Nuts",
  "Gluten", "Wheat", "Fish", "Peanuts", "Sesame",
];

const VALID_DISEASES = [
  "Diabetes", "Blood Pressure", "Heart Disease", "Obesity",
  "Kidney Disease", "Liver Disease", "Celiac Disease",
  "Lactose Intolerance", "Thyroid Disorder", "PCOS", "Anemia", "Gout", "None",
];
const VALID_OTHER_ALLERGIES = [
  "peanuts", "tree nuts", "almonds", "walnuts", "cashews",
  "pistachios", "hazelnuts", "pecans", "brazil nuts", "macadamia nuts",
  "milk", "dairy", "butter", "cheese", "cream", "yogurt", "lactose",
  "whey", "casein", "eggs", "egg whites", "egg yolk", "soy", "soybeans",
  "soy sauce", "tofu", "gluten", "wheat", "barley", "rye", "oats",
  "semolina", "spelt", "seafood", "fish", "salmon", "tuna", "shellfish",
  "shrimp", "prawns", "crab", "lobster", "mussels", "clams", "squid",
  "octopus", "mustard", "sesame", "sesame seeds", "sulphites", "sulfites",
  "celery", "corn", "maize", "chocolate", "cocoa", "strawberries", "kiwi",
  "banana", "pineapple", "mango", "citrus", "orange", "lemon", "lime",
  "garlic", "onion", "tomato", "potato", "carrot", "peas", "lentils",
  "chickpeas", "beans", "black beans", "kidney beans", "green beans",
  "coconut", "sunflower seeds", "pumpkin seeds", "chia seeds", "flax seeds",
  "cinnamon", "black pepper", "paprika", "turmeric", "cumin", "coriander",
  "cardamom", "cloves", "nutmeg", "ginger", "vanilla", "yeast",
  "baking powder", "food coloring", "artificial colors", "artificial flavors",
  "msg", "monosodium glutamate", "aspartame", "gelatin", "beef", "chicken",
  "mutton", "lamb", "pork", "turkey", "duck", "mayonnaise", "ketchup",
  "mustard sauce", "barbecue sauce", "vinegar", "apple cider vinegar",
  "alcohol", "wine", "beer", "caffeine", "coffee", "tea", "green tea",
  "herbal tea", "energy drinks", "carbonated drinks", "honey", "maple syrup",
  "peach", "pear", "apple", "grapes", "watermelon", "melon", "avocado",
  "spinach", "broccoli", "cauliflower", "cabbage", "lettuce", "zucchini",
  "eggplant", "mushrooms", "truffle", "anchovies", "sardines",
  "anchovy paste", "fish sauce", "soy lecithin", "glucose syrup",
  "corn syrup", "peanut oil", "sunflower oil",
];
const VALID_DIETARY = [
  "Low Sugar", "Low Sodium", "Low Fat", "High Protein",
  "Vegetarian", "Vegan", "Gluten Free", "Dairy Free",
];

const VALID_HEALTH_GOALS = [
  "Weight Loss", "Weight Gain", "Maintain Health", "Muscle Building",
  "Improve Energy", "Better Sleep", "Manage Diabetes", "Heart Health",
];

// ─── Schema ─────────────────────────────────────────────────────
const healthProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Basic Info ──────────────────────────────────────────
    age: {
      type: Number,
      min: [1, "Age must be at least 1"],
      max: [120, "Age cannot exceed 120"],
      validate: {
        validator: Number.isInteger,
        message: "Age must be a whole number",
      },
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other", "prefer-not-to-say"],
        message: "Invalid gender value",
      },
    },

    height: {
      type: Number,
      min: [50, "Height must be at least 50 cm"],
      max: [300, "Height cannot exceed 300 cm"],
    },

    weight: {
      type: Number,
      min: [10, "Weight must be at least 10 kg"],
      max: [500, "Weight cannot exceed 500 kg"],
    },

    // ── Allergies ───────────────────────────────────────────
    allergies: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) => VALID_ALLERGIES.includes(item));
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_ALLERGIES.includes(item)
          );
          return `Invalid allergies: ${invalid.join(", ")}. Valid options: ${VALID_ALLERGIES.join(", ")}`;
        },
      },
      default: [],
    },

    medicineAllergies: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) =>
            VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
          );
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
          );
          return `These are not valid medicine/other allergies: "${invalid.join('", "')}". Please select from the provided list.`;
        },
      },
      default: [],
    },

    otherAllergies: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) =>
            VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
          );
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
          );
          return `These are not recognized allergies: "${invalid.join('", "')}". Please select from the provided list.`;
        },
      },
      default: [],
    },

    // ── Diseases ────────────────────────────────────────────
    diseases: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) => VALID_DISEASES.includes(item));
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_DISEASES.includes(item)
          );
          return `Invalid conditions: ${invalid.join(", ")}. Valid options: ${VALID_DISEASES.join(", ")}`;
        },
      },
      default: [],
    },

    // ── Dietary ─────────────────────────────────────────────
    dietaryPreference: {
      type: String,
      enum: {
        values: ["vegetarian", "non-vegetarian", "vegan", ""],
        message: "Invalid dietary preference",
      },
      default: "",
    },

    dietaryRestrictions: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) => VALID_DIETARY.includes(item));
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_DIETARY.includes(item)
          );
          return `Invalid dietary options: ${invalid.join(", ")}`;
        },
      },
      default: [],
    },

    // ── Lifestyle ───────────────────────────────────────────
    activityLevel: {
      type: String,
      enum: {
        values: ["low", "moderate", "active", ""],
        message: "Invalid activity level",
      },
      default: "",
    },

    exerciseFrequency: {
      type: String,
      enum: {
        values: ["rarely", "sometimes", "often", "daily", ""],
        message: "Invalid exercise frequency",
      },
      default: "",
    },

    // ── Health Goals ────────────────────────────────────────
    healthGoals: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((item) => VALID_HEALTH_GOALS.includes(item));
        },
        message: (props) => {
          const invalid = props.value.filter(
            (item) => !VALID_HEALTH_GOALS.includes(item)
          );
          return `Invalid health goals: ${invalid.join(", ")}`;
        },
      },
      default: [],
    },

    // ── Notes ───────────────────────────────────────────────
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Export valid lists ──────────────────────────────────────────
export { VALID_ALLERGIES, VALID_DISEASES, VALID_DIETARY, VALID_HEALTH_GOALS, VALID_OTHER_ALLERGIES };

const HealthProfile = mongoose.model("HealthProfile", healthProfileSchema);

export default HealthProfile;