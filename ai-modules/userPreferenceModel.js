const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

/**
 * Analyze user preferences based on past orders
 * @param {String} userId
 * @returns {Array} top categories/items
 */
const analyzeUserPreferences = async (userId) => {
  // Step 1: Fetch all orders of the user
  const orders = await Order.find({ user: userId }).populate("items.menuItem");

  // Step 2: Count frequency of each menu item
  const itemFrequency = {};
  orders.forEach((order) => {
    order.items.forEach(({ menuItem }) => {
      if (!menuItem) return; // just in case
      itemFrequency[menuItem._id] = (itemFrequency[menuItem._id] || 0) + 1;
    });
  });

  // Step 3: Sort items by frequency (descending)
  const sortedItems = Object.entries(itemFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([itemId]) => itemId);

  // Step 4: Fetch menu item details
  const topItems = await MenuItem.find({ _id: { $in: sortedItems } });

  return topItems;
};

module.exports = { analyzeUserPreferences };
