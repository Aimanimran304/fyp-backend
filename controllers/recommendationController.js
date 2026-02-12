import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import AllergyProfile from "../models/AllergyProfile.js";

// @desc    Get food recommendations for logged-in user
// @route   GET /api/recommendations
// @access  Private (Customer)
export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Get user allergy profile
    const allergyProfile = await AllergyProfile.findOne({ user: userId });
    const userAllergies = allergyProfile ? allergyProfile.allergies : [];

    // 2️⃣ Get user's past orders
    const orders = await Order.find({ user: userId }).populate("items.menuItemId");

    // 3️⃣ Determine preferred categories from past orders
    let preferredCategories = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.menuItemId?.category) {
          preferredCategories.push(item.menuItemId.category);
        }
      });
    });

    // Remove duplicates
    preferredCategories = [...new Set(preferredCategories)];

    // 4️⃣ Recommend menu items avoiding user's allergies
    const recommendations = await MenuItem.find({
      category: { $in: preferredCategories },
      allergens: { $nin: userAllergies },
      isAvailable: true,
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
