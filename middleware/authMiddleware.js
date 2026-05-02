import jwt  from "jsonwebtoken";
import User from "../models/User.js";

// ─── PROTECT — token verify karo ─────────────────────────────────────────────
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
  }
};

// ─── IS ADMIN — role check karo ──────────────────────────────────────────────
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
};

// ─── Default export (purani files jo `import authMiddleware from` use karti hain)
export default protect;