import roles from "../config/roles.js";

// roleArray = allowed roles for the route
const roleMiddleware = (roleArray) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized"
      });
    }

    // Check if user role is allowed
    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: You do not have access to this resource"
      });
    }

    next();
  };
};

export default roleMiddleware;
