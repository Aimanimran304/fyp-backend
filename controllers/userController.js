import User from "../models/User.js";
import AllergyProfile from "../models/AllergyProfile.js";

// ===============================
// GET USER PROFILE
// ===============================
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

// ===============================
// UPDATE USER PROFILE
// ===============================
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// ADD / UPDATE ALLERGY PROFILE
// ===============================
export const addAllergyProfile = async (req, res, next) => {
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

// ===============================
// GET ALLERGY PROFILE
// ===============================
export const getAllergyProfile = async (req, res, next) => {
  try {
    const profile = await AllergyProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Allergy profile not found",
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
