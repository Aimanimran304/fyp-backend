const MenuItem = require("../models/MenuItem");
const AllergyProfile = require("../models/AllergyProfile");

/**
 * Get top recommended menu items for a user
 * @param {String} userId
 * @returns {Array} top recommended menu items
 */
const getRecommendations = async (userId) => {
  // Step 1: Get user allergy profile
  const allergyProfile = await AllergyProfile.findOne({ user: userId });
  const allergicIngredients = allergyProfile ? allergyProfile.ingredients : [];

  // Step 2: Fetch all menu items
  let menuItems = await MenuItem.find();

  // Step 3: Filter out allergic items
  menuItems = menuItems.filter((item) => {
    return !item.ingredients.some((ing) => allergicIngredients.includes(ing));
  });

  // Step 4: Simple rule-based ranking
  // Example: Items with highest rating first
  menuItems.sort((a, b) => b.rating - a.rating);

  // Step 5: Return top 5
  return menuItems.slice(0, 5);
};

module.exports = { getRecommendations };
