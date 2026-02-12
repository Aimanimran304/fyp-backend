const { body, validationResult } = require("express-validator");

// Validation rules ko wrap karne ke liye function
const validate = (validations) => {
  return async (req, res, next) => {
    // Apply all validation rules
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Agar validation fail ho jaye
    res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  };
};

module.exports = { validate };
