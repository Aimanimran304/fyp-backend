import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import AllergyProfile from "../models/AllergyProfile.js";

// @desc    Place new order
// @route   POST /api/orders
// @access  Customer
export const placeOrder = async (req, res, next) => {
  try {
    const { items } = req.body; 
    // items = [{ menuItemId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    // 🔴 Allergy check
    const allergyProfile = await AllergyProfile.findOne({
      user: req.user._id,
    });

    for (let item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);

      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      if (
        allergyProfile &&
        menuItem.allergens.some((a) =>
          allergyProfile.allergies.includes(a)
        )
      ) {
        return res.status(400).json({
          message: `Allergy alert! ${menuItem.name} contains allergens.`,
        });
      }
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      status: "Pending",
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user orders
// @route   GET /api/orders/my
// @access  Customer
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(
      "items.menuItemId",
      "name price"
    );

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin / Staff)
// @route   GET /api/orders
// @access  Admin / Staff
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.menuItemId", "name price");

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};
