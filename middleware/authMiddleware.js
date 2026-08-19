import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Staff from "../models/Staff.js";

// ─── PROTECT — verify token, load account from whichever collection it belongs to ──
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Staff (chef/waiter/cashier) tokens are signed with { id, role } — check
      // Staff first since role is already known from the token payload.
      let account = null;
      if (decoded.role && decoded.role !== "customer" && decoded.role !== "admin") {
        account = await Staff.findById(decoded.id).select("-password");
      }
      if (!account) account = await User.findById(decoded.id).select("-password");

      if (!account) {
        return res.status(401).json({ success: false, message: "Account not found" });
      }

      req.user = account;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ success: false, message: "No token" });
  }
};

// ─── IS ADMIN ─────────────────────────────────────────────────────
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin access only" });
};

export default protect;
