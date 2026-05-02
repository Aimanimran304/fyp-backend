import HealthProfile, {
  VALID_ALLERGIES,
  VALID_DISEASES,
  VALID_DIETARY,
  VALID_HEALTH_GOALS,
  VALID_OTHER_ALLERGIES,
} from "../models/HealthProfile.js";

// ─── Save / Update Health Profile ──────────────────────────────
const saveHealthProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // ── Sab fields ek saath destructure ──
    const {
      age,
      gender,
      height,
      weight,
      allergies,
      medicineAllergies,
      otherAllergies,
      diseases,
      dietaryPreference,
      dietaryRestrictions,
      activityLevel,
      exerciseFrequency,
      healthGoals,
      notes,
    } = req.body;

    // ── Age validation ──
    if (age !== undefined) {
      if (!Number.isInteger(Number(age)) || age < 1 || age > 120) {
        return res.status(400).json({
          success: false,
          message: "Age must be a whole number between 1 and 120",
        });
      }
    }

    // ── Height validation ──
    if (height !== undefined && (height < 50 || height > 300)) {
      return res.status(400).json({
        success: false,
        message: "Height must be between 50 and 300 cm",
      });
    }

    // ── Weight validation ──
    if (weight !== undefined && (weight < 10 || weight > 500)) {
      return res.status(400).json({
        success: false,
        message: "Weight must be between 10 and 500 kg",
      });
    }

    // ── Allergies validation ──
    if (allergies && allergies.length > 0) {
      const invalidAllergies = allergies.filter(
        (a) => !VALID_ALLERGIES.includes(a)
      );
      if (invalidAllergies.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid allergies: "${invalidAllergies.join('", "')}". Please select from the provided list only.`,
          validOptions: VALID_ALLERGIES,
        });
      }
    }

    // ── Diseases validation ──
    if (diseases && diseases.length > 0) {
      const invalidDiseases = diseases.filter(
        (d) => !VALID_DISEASES.includes(d)
      );
      if (invalidDiseases.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid conditions: "${invalidDiseases.join('", "')}". Please select from the provided list only.`,
          validOptions: VALID_DISEASES,
        });
      }
    }
    // ── Medicine Allergies validation ──
    if (medicineAllergies && medicineAllergies.length > 0) {
      const invalidMedicine = medicineAllergies.filter(
        (item) => !VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
      );
      if (invalidMedicine.length > 0) {
        return res.status(400).json({
          success: false,
          message: `"${invalidMedicine.join('", "')}" — these are not recognized allergies. Please select valid ones only.`,
          validOptions: VALID_OTHER_ALLERGIES,
        });
      }
    }

    // ── Other Allergies validation ──
    if (otherAllergies && otherAllergies.length > 0) {
      const invalidOther = otherAllergies.filter(
        (item) => !VALID_OTHER_ALLERGIES.includes(item.toLowerCase().trim())
      );
      if (invalidOther.length > 0) {
        return res.status(400).json({
          success: false,
          message: `"${invalidOther.join('", "')}" — not recognized. Please select from the valid allergy list.`,
          validOptions: VALID_OTHER_ALLERGIES,
        });
      }
    }
    // ── Dietary restrictions validation ──
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      const invalidDietary = dietaryRestrictions.filter(
        (d) => !VALID_DIETARY.includes(d)
      );
      if (invalidDietary.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid dietary options: "${invalidDietary.join('", "')}".`,
          validOptions: VALID_DIETARY,
        });
      }
    }

    // ── Health goals validation ──
    if (healthGoals && healthGoals.length > 0) {
      const invalidGoals = healthGoals.filter(
        (g) => !VALID_HEALTH_GOALS.includes(g)
      );
      if (invalidGoals.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid health goals: "${invalidGoals.join('", "')}".`,
          validOptions: VALID_HEALTH_GOALS,
        });
      }
    }

    // ── Save to DB ──
    const profile = await HealthProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        age: age || undefined,
        gender: gender || undefined,
        height: height || undefined,
        weight: weight || undefined,
        allergies: allergies || [],
        medicineAllergies: medicineAllergies || "",
        otherAllergies: otherAllergies || "",
        diseases: diseases || [],
        dietaryPreference: dietaryPreference || "",
        dietaryRestrictions: dietaryRestrictions || [],
        activityLevel: activityLevel || "",
        exerciseFrequency: exerciseFrequency || "",
        healthGoals: healthGoals || [],
        notes: notes || "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Health profile saved successfully",
      profile,
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
    }
    console.error("Save health profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ─── Get Health Profile ─────────────────────────────────────────
const getHealthProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await HealthProfile.findOne({ user: userId });

    res.status(200).json({
      success: true,
      profile: profile || null,
      validOptions: {
        allergies: VALID_ALLERGIES,
        diseases: VALID_DISEASES,
        dietaryRestrictions: VALID_DIETARY,
        healthGoals: VALID_HEALTH_GOALS,
      },
    });
  } catch (error) {
    console.error("Get health profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ─── Delete Health Profile ──────────────────────────────────────
const deleteHealthProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    await HealthProfile.findOneAndDelete({ user: userId });

    res.status(200).json({
      success: true,
      message: "Health profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete health profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ─── Get Valid Options — frontend dropdowns k liye ──────────────
const getValidOptions = async (req, res) => {
  res.status(200).json({
    success: true,
    validOptions: {
      allergies: VALID_ALLERGIES,
      diseases: VALID_DISEASES,
      dietaryRestrictions: VALID_DIETARY,
      healthGoals: VALID_HEALTH_GOALS,
    },
  });
};

export {
  saveHealthProfile,
  getHealthProfile,
  deleteHealthProfile,
  getValidOptions,
};