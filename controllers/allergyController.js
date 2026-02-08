import AllergyProfile from "../models/AllergyProfile.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";

// @desc    Create or update allergy profile
// @route   POST /api/allergy
// @access  Customer
export const saveAllergyProfile = async (req, res, next) => {
  try {
    const { allergies, severityLevel, notes } = req.body;

    let profile = await AllergyProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.allergies = allergies || profile.allergies;
      profile.severityLevel = severityLevel || profile.severityLevel;
      profile.notes = notes || profile.notes;
      await profile.save();
    } else {
      profile = await AllergyProfile.create({
        user: req.user._id,
        allergies,
        severityLevel,
        notes,
      });

      await User.findByIdAndUpdate(req.user._id, {
        allergyProfile: profile._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Allergy profile saved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check allergy for a menu item
// @route   POST /api/allergy/check
// @access  Customer
export const checkAllergyForItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.body;

    const profile = await AllergyProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        message: "Allergy profile not found",
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const matchedAllergies = menuItem.allergens.filter((allergen) =>
      profile.allergies.includes(allergen)
    );

    if (matchedAllergies.length > 0) {
      return res.status(200).json({
        safe: false,
        severity: profile.severityLevel,
        message: "⚠️ Allergy alert!",
        matchedAllergies,
      });
    }

    res.status(200).json({
      safe: true,
      message: "✅ This item is safe to consume",
    });
  } catch (error) {
    next(error);
  }
};
