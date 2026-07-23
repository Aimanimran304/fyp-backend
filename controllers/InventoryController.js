import Inventory from "../models/Inventory.js";

// ─── GET /api/inventory — Chef + Admin: get all inventory ─────────
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ quantity: 1 }); // low stock first
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/inventory/low — Low stock items only ───────────────
export const getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$quantity", "$minimumStock"] },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── POST /api/inventory — Admin: add item ────────────────────────
export const addInventoryItem = async (req, res) => {
  try {
    const { name, quantity, unit, minimumStock, category, supplier, pricePerUnit, notes } = req.body;

    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({ message: "Name, quantity, and unit are required" });
    }

    const item = await Inventory.create({
      name,
      quantity,
      unit,
      minimumStock: minimumStock || 10,
      category: category || "other",
      supplier,
      pricePerUnit,
      notes,
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/inventory/:id — Admin: update item ───────────────
export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const fields = ["name", "quantity", "unit", "minimumStock", "category", "supplier", "pricePerUnit", "notes"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE /api/inventory/:id — Admin: remove item ──────────────
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true, message: "Item removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── POST /api/inventory/seed — Dev only: seed sample data ───────
export const seedInventory = async (req, res) => {
  try {
    const count = await Inventory.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: "Inventory already has data" });
    }

    const sampleItems = [
      { name: "Chicken", quantity: 15, unit: "kg", minimumStock: 10, category: "meat", pricePerUnit: 650 },
      { name: "Tomatoes", quantity: 8, unit: "kg", minimumStock: 5, category: "vegetables", pricePerUnit: 80 },
      { name: "Onions", quantity: 12, unit: "kg", minimumStock: 8, category: "vegetables", pricePerUnit: 60 },
      { name: "Basmati Rice", quantity: 25, unit: "kg", minimumStock: 15, category: "grains", pricePerUnit: 200 },
      { name: "Cooking Oil", quantity: 4, unit: "liter", minimumStock: 5, category: "other", pricePerUnit: 450 },
      { name: "Milk", quantity: 10, unit: "liter", minimumStock: 8, category: "dairy", pricePerUnit: 120 },
      { name: "Garam Masala", quantity: 2, unit: "kg", minimumStock: 1, category: "spices", pricePerUnit: 900 },
      { name: "Coca Cola", quantity: 48, unit: "pieces", minimumStock: 24, category: "beverages", pricePerUnit: 80 },
      { name: "Eggs", quantity: 3, unit: "dozen", minimumStock: 5, category: "dairy", pricePerUnit: 180 },
      { name: "Flour (Maida)", quantity: 20, unit: "kg", minimumStock: 10, category: "grains", pricePerUnit: 85 },
    ];

    await Inventory.insertMany(sampleItems);
    res.json({ success: true, message: `${sampleItems.length} items seeded successfully` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};