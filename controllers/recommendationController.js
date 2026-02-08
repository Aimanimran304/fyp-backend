import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import AllergyProfile from "../models/AllergyProfile.js";

// @desc    Get food recommendations for logged-in user
// @route   GET /api/recommendations
// @access  Customer
export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Get user allergy profile
    const allergyProfile = await AllergyProfile.findOne({ user: userId });

    const userAllergies = allergyProfile
      ? allergyProfile.allergies
      : [];

    // 2️⃣ Get user order history
    const orders = await Order.find({ user: userId }).populate(
      "items.menuItem"
    );

    let preferredCategories = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.menuItem?.category) {
          preferredCategories.push(item.menuItem.category);
        }
      });
    });

    // 3️⃣ Remove duplicates
    preferredCategories = [...new Set(preferredCategories)];

    // 4️⃣ Find menu items matching preferences & avoiding allergies
    const recommendations = await MenuItem.find({
      category: { $in: preferredCategories },
      allergens: { $nin: userAllergies },
    }).limit(6);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};
