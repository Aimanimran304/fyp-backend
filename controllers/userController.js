import User from "../models/User.js";
import AllergyProfile from "../models/AllergyProfile.js";

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("allergyProfile");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Add or Update Allergy Profile
// @route   POST /api/users/allergy
// @access  Private
export const addOrUpdateAllergyProfile = async (req, res, next) => {
  try {
    const { allergies, severityLevel, notes } = req.body;

    let allergyProfile = await AllergyProfile.findOne({
      user: req.user.id,
    });

    if (allergyProfile) {
      allergyProfile.allergies = allergies;
      allergyProfile.severityLevel = severityLevel;
      allergyProfile.notes = notes;
      await allergyProfile.save();
    } else {
      allergyProfile = await AllergyProfile.create({
        user: req.user.id,
        allergies,
        severityLevel,
        notes,
      });

      await User.findByIdAndUpdate(req.user.id, {
        allergyProfile: allergyProfile._id,
      });
    }

    res.status(200).json({
      message: "Allergy profile saved successfully",
      allergyProfile,
    });
  } catch (error) {
    next(error);
  }
};
