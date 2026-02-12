const MenuItem = require("../models/MenuItem");
const AllergyProfile = require("../models/AllergyProfile");

/**
 * Check if a menu item is safe for a user
 * @param {String} userId
 * @param {String} menuItemId
 * @returns {Object} { safe: Boolean, allergens: Array }
 */
const checkAllergy = async (userId, menuItemId) => {
  // Step 1: Fetch user allergy profile
  const allergyProfile = await AllergyProfile.findOne({ user: userId });
  const allergicIngredients = allergyProfile ? allergyProfile.ingredients : [];

  // Step 2: Fetch menu item
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  // Step 3: Compare ingredients with allergies
  const allergensFound = menuItem.ingredients.filter((ing) =>
    allergicIngredients.includes(ing)
  );

  // Step 4: Return result
  return {
    safe: allergensFound.length === 0,
    allergens: allergensFound,
  };
};

module.exports = { checkAllergy };
