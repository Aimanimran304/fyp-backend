// 📁 ai-modules/userPreferenceModel.js

import Order from "../models/Order.js";

/**
 * 🧠 Enhanced User Preference Model
 * Calculates:
 * 1. Item frequency score
 * 2. Category preference score
 * 3. Total interaction weight
 */

const calculateUserPreference = async (userId) => {
  try {
    const orders = await Order.find({ user: userId })
      .populate("items.menuItemId");

    const itemScore = {};
    const categoryScore = {};
    let totalOrders = 0;

    orders.forEach(order => {
      totalOrders++;

      order.items.forEach(item => {
        const menuItem = item.menuItemId;

        // Item frequency
        if (!itemScore[menuItem.name]) {
          itemScore[menuItem.name] = 1;
        } else {
          itemScore[menuItem.name]++;
        }

        // Category frequency
        if (!categoryScore[menuItem.category]) {
          categoryScore[menuItem.category] = 1;
        } else {
          categoryScore[menuItem.category]++;
        }
      });
    });

    return {
      totalOrders,
      itemScore,
      categoryScore
    };

  } catch (error) {
    console.error("User Preference Model Error:", error.message);
    throw new Error("Failed to calculate user preferences");
  }
};

export default calculateUserPreference;
