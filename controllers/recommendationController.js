import MenuItem from "../models/MenuItem.js";
import HealthProfile from "../models/HealthProfile.js";

// ─── Score an item against health profile ────────────────────────
function scoreItem(item, profile) {
  let score = 0;
  const reasons = [];
  const warnings = [];

  const diseases = (profile.diseases || []).map((d) => d.toLowerCase());
  const allergies = [
    ...(profile.allergies || []),
    ...(profile.otherAllergies || []),
    ...(profile.medicineAllergies || []),
  ].map((a) => a.toLowerCase());
  const goals = (profile.healthGoals || []).map((g) => g.toLowerCase());
  const restrictions = (profile.dietaryRestrictions || []).map((r) =>
    r.toLowerCase()
  );
  const diet = (profile.dietaryPreference || "").toLowerCase();

  // ── Hard disqualifiers (allergy match) ──────────────────────────
  const itemAllergens = (item.allergens || []).map((a) => a.toLowerCase());
  const allergyMatch = itemAllergens.some((a) =>
    allergies.some((ua) => ua.includes(a) || a.includes(ua))
  );
  if (allergyMatch) return { score: -999, reasons, warnings: ["contains allergen"] };

  // ── Disease-based notRecommendedFor check ───────────────────────
  const notRec = (item.notRecommendedFor || []).map((d) => d.toLowerCase());
  const diseaseConflict = diseases.some((d) =>
    notRec.some((nr) => nr.includes(d) || d.includes(nr))
  );
  if (diseaseConflict) return { score: -999, reasons: [], warnings: ["not recommended for your condition"] };

  // ── Disease-based recommendedFor boost ──────────────────────────
  const recFor = (item.recommendedFor || []).map((r) => r.toLowerCase());
  const diseaseMatch = diseases.some((d) =>
    recFor.some((r) => r.includes(d) || d.includes(r))
  );
  if (diseaseMatch) {
    score += 40;
    reasons.push("suitable for your condition");
  }

  // ── Health tags vs restrictions ──────────────────────────────────
  const tags = (item.healthTags || []).map((t) => t.toLowerCase());

  if (restrictions.includes("low sugar") || diseases.includes("diabetes")) {
    const nutrition = item.nutrition || {};
    if ((nutrition.sugar || 0) < 10) { score += 20; reasons.push("low sugar"); }
    else if ((nutrition.sugar || 0) > 25) { score -= 20; }
  }

  if (restrictions.includes("low sodium") || diseases.some(d => d.includes("hypertension") || d.includes("blood pressure"))) {
    const nutrition = item.nutrition || {};
    if ((nutrition.sodium || 0) < 400) { score += 20; reasons.push("low sodium"); }
    else if ((nutrition.sodium || 0) > 700) { score -= 15; }
  }

  if (restrictions.includes("low fat") || diseases.some(d => d.includes("heart") || d.includes("obesity"))) {
    const nutrition = item.nutrition || {};
    if ((nutrition.fat || 0) < 15) { score += 15; reasons.push("low fat"); }
    else if ((nutrition.fat || 0) > 30) { score -= 15; }
  }

  if (restrictions.includes("high protein") || goals.some(g => g.includes("muscle") || g.includes("protein"))) {
    const nutrition = item.nutrition || {};
    if ((nutrition.protein || 0) >= 25) { score += 25; reasons.push("high protein"); }
  }

  if (restrictions.includes("gluten free") || diseases.includes("celiac disease")) {
    if (item.isGlutenFree) { score += 20; reasons.push("gluten free"); }
    else { score -= 50; }
  }

  if (restrictions.includes("dairy free") || diseases.includes("lactose intolerance")) {
    if (item.isDairyFree) { score += 20; reasons.push("dairy free"); }
    else { score -= 30; }
  }

  // ── Dietary preference ──────────────────────────────────────────
  if (diet === "vegetarian" && !item.isVegetarian) { score -= 50; }
  if (diet === "vegan" && !item.isVegan) { score -= 50; }
  if (diet === "vegetarian" && item.isVegetarian) { score += 15; reasons.push("vegetarian"); }
  if (diet === "vegan" && item.isVegan) { score += 15; reasons.push("vegan"); }

  // ── Health goals ─────────────────────────────────────────────────
  if (goals.some(g => g.includes("weight loss"))) {
    const cal = item.calories || 999;
    if (cal < 300) { score += 20; reasons.push("low calorie"); }
    else if (cal > 500) { score -= 10; }
    if (tags.includes("low-calorie")) { score += 10; }
  }

  if (goals.some(g => g.includes("heart"))) {
    if (tags.includes("heart-healthy")) { score += 25; reasons.push("heart healthy"); }
  }

  // ── Health tags bonus ────────────────────────────────────────────
  if (tags.includes("grilled")) { score += 5; }
  if (tags.includes("antioxidant")) { score += 5; }

  // ── Calorie cap based on BMI (if height & weight provided) ──────
  if (profile.height && profile.weight) {
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    if (bmi > 30 && (item.calories || 0) > 500) {
      score -= 15;
      warnings.push("high calorie for your profile");
    }
  }

  // ── Base score from rating ───────────────────────────────────────
  score += (item.rating || 0) * 2;

  return { score, reasons: [...new Set(reasons)], warnings: [...new Set(warnings)] };
}

// ─── Build a short AI message ─────────────────────────────────────
function buildAiMessage(profile, count) {
  const diseases = profile.diseases || [];
  const goals = profile.healthGoals || [];
  const diet = profile.dietaryPreference || "";

  let parts = [];

  if (diseases.length > 0 && !diseases.includes("None")) {
    parts.push(`keeping your ${diseases.slice(0, 2).join(" & ")} in mind`);
  }
  if (goals.length > 0) {
    parts.push(`supporting your goal of ${goals[0].toLowerCase()}`);
  }
  if (diet && diet !== "") {
    parts.push(`matching your ${diet} preference`);
  }

  const context = parts.length > 0
    ? `We picked these ${count} items ${parts.join(", ")}.`
    : `Here are ${count} healthy picks from our menu for you.`;

  return context + " Enjoy your meal! 🍽️";
}

// ─── GET /api/recommendations ─────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if health profile exists
    const profile = await HealthProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(200).json({
        success: true,
        hasProfile: false,
        recommendations: [],
      });
    }

    // Fetch all available menu items
    const allItems = await MenuItem.find({ isAvailable: true });

    // Score each item
    const scored = allItems
      .map((item) => {
        const { score, reasons, warnings } = scoreItem(item.toObject(), profile);
        return { item, score, reasons, warnings };
      })
      .filter(({ score }) => score > 0) // Only positive-score items
      .sort((a, b) => b.score - a.score); // Best first

    // Attach reasons/warnings to items
    const recommendations = scored.map(({ item, reasons, warnings }) => ({
      ...item.toObject(),
      _recommendReasons: reasons,
      _recommendWarnings: warnings,
    }));

    const aiMessage = buildAiMessage(profile, recommendations.length);

    // Profile summary for frontend tags
    const profileSummary = {
      diseases: (profile.diseases || []).filter(d => d !== "None"),
      diet: profile.dietaryPreference || "",
      goals: profile.healthGoals || [],
    };

    res.status(200).json({
      success: true,
      hasProfile: true,
      aiMessage,
      profileSummary,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/recommendations/cart-check ─────────────────────────
// Check karo k cart item user ki health k against hai ya nahi
export const cartHealthCheck = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.body;

    const profile = await HealthProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(200).json({ safe: true, warnings: [] });
    }

    const item = await MenuItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const diseases = (profile.diseases || [])
      .filter((d) => d !== "None")
      .map((d) => d.toLowerCase());

    const allergies = [
      ...(profile.allergies || []),
      ...(profile.otherAllergies || []),
      ...(profile.medicineAllergies || []),
    ].map((a) => a.toLowerCase());

    const nutrition = item.nutrition || {};

    // ── 1. Allergy check (DANGER — hard block) ──────────────────
    const itemAllergens = (item.allergens || []).map((a) => a.toLowerCase());
    const allergyMatch = itemAllergens.some((a) =>
      allergies.some((ua) => ua.includes(a) || a.includes(ua))
    );
    if (allergyMatch) {
      return res.status(200).json({
        safe: false,
        severity: "danger",
        warnings: ["This item contains ingredients you are allergic to!"],
        itemName: item.name,
      });
    }

    // ── 2. notRecommendedFor field check ────────────────────────
    const notRec = (item.notRecommendedFor || []).map((d) => d.toLowerCase());
    const notRecConflict = diseases.some((d) =>
      notRec.some((nr) => nr.includes(d) || d.includes(nr))
    );
    if (notRecConflict) {
      const conflicting = diseases.filter((d) =>
        notRec.some((nr) => nr.includes(d) || d.includes(nr))
      );
      return res.status(200).json({
        safe: false,
        severity: "warning",
        warnings: [
          `This item is not recommended if you have ${conflicting.join(", ")}.`,
        ],
        itemName: item.name,
      });
    }

    // ── 3. Disease-based nutrition checks ───────────────────────
    const warningMessages = [];

    // Diabetes — high sugar or high carbs
    if (diseases.some((d) => d.includes("diabetes"))) {
      if ((nutrition.sugar || 0) > 20) {
        warningMessages.push(
          `High sugar content (${nutrition.sugar}g) — not ideal for diabetes.`
        );
      } else if ((nutrition.carbs || 0) > 50) {
        warningMessages.push(
          `High carb content (${nutrition.carbs}g) — may affect blood sugar levels.`
        );
      }
    }

    // Blood Pressure / Hypertension — high sodium
    if (
      diseases.some(
        (d) => d.includes("blood pressure") || d.includes("hypertension")
      )
    ) {
      if ((nutrition.sodium || 0) > 600) {
        warningMessages.push(
          `High sodium content (${nutrition.sodium}mg) — not ideal for blood pressure.`
        );
      }
    }

    // Heart Disease — high fat or high sodium
    if (diseases.some((d) => d.includes("heart"))) {
      if ((nutrition.fat || 0) > 25) {
        warningMessages.push(
          `High fat content (${nutrition.fat}g) — not ideal for heart disease.`
        );
      }
      if ((nutrition.sodium || 0) > 600) {
        warningMessages.push(
          `High sodium (${nutrition.sodium}mg) — may affect heart health.`
        );
      }
    }

    // Obesity — high calories
    if (diseases.some((d) => d.includes("obesity"))) {
      if ((item.calories || 0) > 600) {
        warningMessages.push(
          `High calorie item (${item.calories} kcal) — consider a lighter option.`
        );
      }
    }

    // Kidney Disease — high sodium or high protein
    if (diseases.some((d) => d.includes("kidney"))) {
      if ((nutrition.sodium || 0) > 500) {
        warningMessages.push(
          `High sodium (${nutrition.sodium}mg) — may stress kidneys.`
        );
      }
      if ((nutrition.protein || 0) > 30) {
        warningMessages.push(
          `High protein (${nutrition.protein}g) — not ideal for kidney disease.`
        );
      }
    }

    // Gout — high protein (purines)
    if (diseases.some((d) => d.includes("gout"))) {
      if ((nutrition.protein || 0) > 25) {
        warningMessages.push(
          `High protein content may increase uric acid levels (gout concern).`
        );
      }
    }

    // Celiac Disease — gluten check
    if (diseases.some((d) => d.includes("celiac"))) {
      if (!item.isGlutenFree) {
        warningMessages.push(
          `This item may contain gluten — not safe for celiac disease.`
        );
      }
    }

    // Lactose Intolerance — dairy check
    if (diseases.some((d) => d.includes("lactose"))) {
      if (!item.isDairyFree) {
        warningMessages.push(
          `This item may contain dairy — not ideal for lactose intolerance.`
        );
      }
    }

    if (warningMessages.length > 0) {
      return res.status(200).json({
        safe: false,
        severity: "warning", // ← warning (not danger), so "Add Anyway" button shows
        warnings: warningMessages,
        itemName: item.name,
      });
    }

    // ── All clear ────────────────────────────────────────────────
    res.status(200).json({ safe: true, warnings: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};