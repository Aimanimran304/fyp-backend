import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import AllergyProfile from "../models/AllergyProfile.js";

/* ===============================
   PLACE ORDER
   POST /api/orders
   Customer
================================ */
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

    for (const item of items) {
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
          message: `Allergy alert! ${menuItem.name} contains allergens`,
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

/* ===============================
   GET MY ORDERS
   GET /api/orders/my
   Customer
================================ */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.menuItemId", "name price");

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/* ===============================
   GET ALL ORDERS
   GET /api/orders
   Admin / Staff
================================ */
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

/* ===============================
   UPDATE ORDER STATUS
   PUT /api/orders/:id
   Admin / Staff
================================ */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status || order.status;
    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};
