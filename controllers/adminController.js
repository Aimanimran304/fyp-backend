import bcrypt     from "bcryptjs";
import jwt        from "jsonwebtoken";
import User        from "../models/User.js";
import Order       from "../models/Order.js";
import MenuItem    from "../models/MenuItem.js";
import Reservation from "../models/Reservation.js";
import HealthProfile from "../models/HealthProfile.js";

// ════════════════════════════════════════════
// ADMIN AUTH
// ════════════════════════════════════════════

// ─── Token helper ────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// ─── AUTO-CREATE ADMIN on server start ───────────────────────────────────────
export const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admi$123", 10);
      await User.create({
        name:     "Admin",
        email:    "adminrestrotech@gmail.com",
        password: hashedPassword,
        role:     "admin",
        phone:    "03000000000",
        address:  "RestroTech HQ",
      });
      console.log("✅ Admin created → adminrestrotech@gmail.com | Pass: Admi$123");
    } else {
      console.log("ℹ️  Admin already exists");
    }
  } catch (error) {
    console.error("❌ Admin creation error:", error);
  }
};

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ sirf role: "admin" wala user — customer yahan se login nahi kar sakta
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      token: generateToken(admin._id),
      user: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════
export const getDashboardStats = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalOrders,
      totalMenuItems,
      totalReservations,
      todayOrders,
      pendingOrders,
      monthOrders,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Order.countDocuments(),
      MenuItem.countDocuments({ isAvailable: true }),
      Reservation.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ["placed", "confirmed", "preparing"] } }),
      Order.find({ createdAt: { $gte: thisMonthStart } }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
      User.find({ role: "customer" }).sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
    ]);

    // Revenue calculations
    const totalRevenue = (await Order.find({ status: { $ne: "cancelled" } }))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayRevenue = (await Order.find({ createdAt: { $gte: today }, status: { $ne: "cancelled" } }))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const monthRevenue = monthOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Orders by type
    const ordersByType = await Order.aggregate([
      { $group: { _id: "$orderType", count: { $sum: 1 } } },
    ]);

    // Daily revenue last 7 days
    const last7Days = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalMenuItems,
        totalReservations,
        todayOrders,
        pendingOrders,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        monthOrders: monthOrders.length,
      },
      charts: { ordersByStatus, ordersByType, last7Days },
      recentOrders,
      recentUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════
// ORDER MANAGEMENT
// ════════════════════════════════════════════
export const getAllOrders = async (req, res) => {
  try {
    const { status, orderType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status    && status    !== "all") filter.status    = status;
    if (orderType && orderType !== "all") filter.orderType = orderType;

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["placed", "confirmed", "preparing", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════
// MENU MANAGEMENT
// ════════════════════════════════════════════
export const adminGetAllMenu = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminAddMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const adminUpdateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const adminDeleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminToggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════
// USER MANAGEMENT
// ════════════════════════════════════════════
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: "customer" };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, user, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET USER HEALTH PROFILE (admin) ─────────────────────────────────────────
export const getUserHealthProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.params.id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: null,
        message: "No health profile found for this user",
      });
    }

    res.json({ success: true, profile });
  } catch (err) {
    console.error("Get user health profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════
// RESERVATION MANAGEMENT
// ════════════════════════════════════════════
export const getAllReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const total        = await Reservation.countDocuments(filter);
    const reservations = await Reservation.find(filter)
      .populate("user", "name email phone")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, reservations, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("user", "name email");

    if (!reservation) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};