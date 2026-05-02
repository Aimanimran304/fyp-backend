// 📁 ai-modules/recommendationEngine.js

import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import AllergyProfile from "../models/AllergyProfile.js";

/**
 * 🎯 AI Recommendation Engine
 * This function:
 * 1. Gets user order history
 * 2. Finds most ordered category
 * 3. Filters allergic items
 * 4. Returns top 5 recommendations
 */

const recommendFood = async (userId) => {
  try {

    // 1️⃣ Get all orders of user
    const orders = await Order.find({ user: userId })
      .populate("items.menuItem");

    // If no previous orders → return random 5 items
    if (!orders || orders.length === 0) {
      return await MenuItem.find().limit(5);
    }

    // 2️⃣ Count most ordered category
    const categoryCount = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItem.category;

        if (!categoryCount[category]) {
          categoryCount[category] = 1;
        } else {
          categoryCount[category]++;
        }
      });
    });

    // Find most frequent category
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    );

    // 3️⃣ Get user allergy profile
    const allergyProfile = await AllergyProfile.findOne({ user: userId });

    const userAllergies = allergyProfile
      ? allergyProfile.allergies
      : [];

    // 4️⃣ Filter recommended items
    const recommendations = await MenuItem.find({
      category: favoriteCategory,
      allergens: { $nin: userAllergies }
    }).limit(5);

    return recommendations;

  } catch (error) {
    console.error("Recommendation Engine Error:", error.message);
    throw new Error("Failed to generate recommendations");
  }
};

export default recommendFood;
