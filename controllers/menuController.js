import MenuItem from "../models/MenuItem.js";

// ============================
// ADD MENU ITEM (Admin)
// ============================
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      ingredients,
      allergens,
      isAvailable
    } = req.body;

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      ingredients,
      allergens,
      isAvailable
    });

    res.status(201).json({
      message: "Menu item created successfully",
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================
// GET ALL MENU ITEMS
// ============================
export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================
// GET MENU ITEM BY ID
// ============================
export const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================
// UPDATE MENU ITEM (Admin)
// ============================
export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({
      message: "Menu item updated",
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================
// DELETE MENU ITEM (Admin)
// ============================
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
