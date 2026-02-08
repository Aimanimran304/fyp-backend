import MenuItem from "../models/MenuItem.js";

// @desc    Add new menu item
// @route   POST /api/menu
// @access  Admin
export const addMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      ingredients,
      allergens,
      isAvailable,
    } = req.body;

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      ingredients,
      allergens,
      isAvailable,
    });

    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
export const getMenuItems = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true });
    res.status(200).json(menuItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
export const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};
