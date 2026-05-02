// 📁 ai-modules/allergyDetection.js

import AllergyProfile from "../models/AllergyProfile.js";

/**
 * 🛡 Allergy Detection System
 * This function:
 * 1. Gets user's allergy profile
 * 2. Matches it with menu item allergens
 * 3. Returns safety status
 */

const checkAllergy = async (userId, menuItem) => {
  try {

    // 1️⃣ Get user's allergy profile
    const profile = await AllergyProfile.findOne({ user: userId });

    // If no allergy profile → food is safe
    if (!profile) {
      return {
        safe: true,
        message: "No allergy profile found. Item is safe."
      };
    }

    const userAllergies = profile.allergies || [];

    // 2️⃣ Match allergens
    const matchedAllergens = menuItem.allergens.filter(allergen =>
      userAllergies.includes(allergen)
    );

    // 3️⃣ If matched → return warning
    if (matchedAllergens.length > 0) {
      return {
        safe: false,
        message: `Warning! This item contains: ${matchedAllergens.join(", ")}`
      };
    }

    // If no match → safe
    return {
      safe: true,
      message: "Item is safe to order."
    };

  } catch (error) {
    console.error("Allergy Detection Error:", error.message);
    throw new Error("Failed to check allergies");
  }
};

export default checkAllergy;
