import MenuItem from "../models/MenuItem.js";
import HealthProfile from "../models/HealthProfile.js";

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8001";
const ML_TIMEOUT_MS = 4000; // don't hang the request if the ML service is down

// ─── Score an item against health profile (RULE-BASED FALLBACK) ───
// Kept as-is. Used only if the ML service is unreachable/slow, so the
// feature never fully breaks (e.g. during your FYP demo).
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

  const itemAllergens = (item.allergens || []).map((a) => a.toLowerCase());
  const allergyMatch = itemAllergens.some((a) =>
    allergies.some((ua) => ua.includes(a) || a.includes(ua))
  );
  if (allergyMatch) return { score: -999, reasons, warnings: ["contains allergen"] };

  const notRec = (item.notRecommendedFor || []).map((d) => d.toLowerCase());
  const diseaseConflict = diseases.some((d) =>
    notRec.some((nr) => nr.includes(d) || d.includes(nr))
  );
  if (diseaseConflict) return { score: -999, reasons: [], warnings: ["not recommended for your condition"] };

  const recFor = (item.recommendedFor || []).map((r) => r.toLowerCase());
  const diseaseMatch = diseases.some((d) =>
    recFor.some((r) => r.includes(d) || d.includes(r))
  );
  if (diseaseMatch) {
    score += 40;
    reasons.push("suitable for your condition");
  }

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

  if (diet === "vegetarian" && !item.isVegetarian) { score -= 50; }
  if (diet === "vegan" && !item.isVegan) { score -= 50; }
  if (diet === "vegetarian" && item.isVegetarian) { score += 15; reasons.push("vegetarian"); }
  if (diet === "vegan" && item.isVegan) { score += 15; reasons.push("vegan"); }

  if (goals.some(g => g.includes("weight loss"))) {
    const cal = item.calories || 999;
    if (cal < 300) { score += 20; reasons.push("low calorie"); }
    else if (cal > 500) { score -= 10; }
    if (tags.includes("low-calorie")) { score += 10; }
  }

  if (goals.some(g => g.includes("heart"))) {
    if (tags.includes("heart-healthy")) { score += 25; reasons.push("heart healthy"); }
  }

  if (tags.includes("grilled")) { score += 5; }
  if (tags.includes("antioxidant")) { score += 5; }

  if (profile.height && profile.weight) {
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    if (bmi > 30 && (item.calories || 0) > 500) {
      score -= 15;
      warnings.push("high calorie for your profile");
    }
  }

  score += (item.rating || 0) * 2;

  return { score, reasons: [...new Set(reasons)], warnings: [...new Set(warnings)] };
}

function ruleBasedRecommendations(allItems, profile) {
  const scored = allItems
    .map((item) => {
      const { score, reasons, warnings } = scoreItem(item.toObject(), profile);
      return { item, score, reasons, warnings };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item, reasons, warnings }) => ({
    ...item.toObject(),
    _recommendReasons: reasons,
    _recommendWarnings: warnings,
  }));
}

// ─── Call the ML FastAPI service ───────────────────────────────────
async function getMlRecommendations(allItems, profile) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          diseases: profile.diseases || [],
          allergies: profile.allergies || [],
          otherAllergies: profile.otherAllergies || [],
          medicineAllergies: profile.medicineAllergies || [],
          dietaryPreference: profile.dietaryPreference || "",
          dietaryRestrictions: profile.dietaryRestrictions || [],
          healthGoals: profile.healthGoals || [],
        },
        items: allItems.map((i) => ({
          id: i._id.toString(),
          name: i.name,
          calories: i.calories,
          nutrition: i.nutrition,
          allergens: i.allergens,
          isVegetarian: i.isVegetarian,
          isVegan: i.isVegan,
          isGlutenFree: i.isGlutenFree,
          isDairyFree: i.isDairyFree,
          isSpicy: i.isSpicy,
          rating: i.rating,
          preparationTime: i.preparationTime,
          notRecommendedFor: i.notRecommendedFor,
          recommendedFor: i.recommendedFor,
        })),
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`ML service returned ${res.status}`);
    const data = await res.json();

    // map ML ids back to full menu item docs, attach verdict/confidence
    const itemsById = new Map(allItems.map((i) => [i._id.toString(), i]));
    const recommendations = data.recommendations
      .map((r) => {
        const doc = itemsById.get(r.id);
        if (!doc) return null;
        return {
          ...doc.toObject(),
          _mlVerdict: r.verdict,
          _mlConfidence: r.confidence,
        };
      })
      .filter(Boolean);

    return recommendations;
  } finally {
    clearTimeout(timeout);
  }
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

    const profile = await HealthProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(200).json({
        success: true,
        hasProfile: false,
        recommendations: [],
      });
    }

    const allItems = await MenuItem.find({ isAvailable: true });

    let recommendations;
    let usedFallback = false;

    try {
      recommendations = await getMlRecommendations(allItems, profile);
    } catch (mlError) {
      console.warn("ML service unavailable, falling back to rule engine:", mlError.message);
      recommendations = ruleBasedRecommendations(allItems, profile.toObject());
      usedFallback = true;
    }

    const aiMessage = buildAiMessage(profile, recommendations.length);

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
      poweredBy: usedFallback ? "rules" : "ml",
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/recommendations/cart-check ─────────────────────────
// Kept rule-based on purpose: this is a fast, hard-block safety check
// (allergens / disease conflicts) that must never depend on a second
// network hop to the ML service. No change needed here.
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

    const warningMessages = [];

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

    if (diseases.some((d) => d.includes("obesity"))) {
      if ((item.calories || 0) > 600) {
        warningMessages.push(
          `High calorie item (${item.calories} kcal) — consider a lighter option.`
        );
      }
    }

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

    if (diseases.some((d) => d.includes("gout"))) {
      if ((nutrition.protein || 0) > 25) {
        warningMessages.push(
          `High protein content may increase uric acid levels (gout concern).`
        );
      }
    }

    if (diseases.some((d) => d.includes("celiac"))) {
      if (!item.isGlutenFree) {
        warningMessages.push(
          `This item may contain gluten — not safe for celiac disease.`
        );
      }
    }

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
        severity: "warning",
        warnings: warningMessages,
        itemName: item.name,
      });
    }

    res.status(200).json({ safe: true, warnings: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};