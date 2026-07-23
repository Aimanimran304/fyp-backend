import Staff from "../models/Staff.js";
import jwt from "jsonwebtoken";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ─── POST /api/staff ──────────────────────────────────────────────
export const createStaff = async (req, res) => {
  try {
    console.log("✅ createStaff hit — req.user:", req.user);
    console.log("✅ req.body:", req.body);

    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["waiter", "chef"].includes(role)) {
      return res.status(400).json({ message: "Role must be waiter or chef" });
    }

    const exists = await Staff.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "A staff member with this email already exists" });
    }

    const staff = await Staff.create({ name, email, role, password });

    res.status(201).json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ createStaff error:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/staff ───────────────────────────────────────────────
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error("❌ getAllStaff error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE /api/staff/:id ────────────────────────────────────────
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json({ success: true, message: "Staff member removed successfully" });
  } catch (err) {
    console.error("❌ deleteStaff error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/staff/:id/toggle ─────────────────────────────────
export const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    staff.isActive = !staff.isActive;
    await staff.save();
    res.json({
      success: true,
      isActive: staff.isActive,
      message: `Staff member marked as ${staff.isActive ? "active" : "inactive"}`,
    });
  } catch (err) {
    console.error("❌ toggleStaffStatus error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── POST /api/staff/login ────────────────────────────────────────
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!staff.isActive) {
      return res.status(403).json({ message: "Your account is inactive. Please contact the admin." });
    }

    const isMatch = await staff.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(staff._id, staff.role);

    res.json({
      success: true,
      token,
      user: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        mustChangePassword: staff.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("❌ staffLogin error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};