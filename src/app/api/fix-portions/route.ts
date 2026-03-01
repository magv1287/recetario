import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { WeeklyPlan, DAYS_OF_WEEK, MealType, DAY_LABELS } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };

const PROTEINS = [
  "pollo", "chicken", "pechuga", "muslo", "thigh",
  "res", "beef", "steak", "sirloin", "flank", "rib eye", "chuck", "ground beef",
  "cerdo", "pork", "chuleta", "costilla", "lomo", "tenderloin", "bacon", "tocino",
  "salmon", "salmón", "tilapia", "bacalao", "cod", "atún", "tuna", "mahi",
  "camarones", "shrimp", "vieiras", "scallops",
  "pavo", "turkey",
];

function isProteinIngredient(ingredient: string): boolean {
  const lower = ingredient.toLowerCase();
  return PROTEINS.some((p) => lower.includes(p));
}

function doubleQuantities(ingredient: string): string {
  // Match patterns like "0.5 lb (227g)" or "0.5 lb (227 g)" or "1 lb (454g)"
  const lbGramPattern = /(\d+\.?\d*)\s*lb\s*\((\d+\.?\d*)\s*g\)/i;
  const match = ingredient.match(lbGramPattern);

  if (match) {
    const oldLb = parseFloat(match[1]);
    const oldG = parseFloat(match[2]);
    const newLb = (oldLb * 2).toFixed(1).replace(/\.0$/, "");
    const newG = Math.round(oldG * 2);
    return ingredient.replace(match[0], `${newLb} lb (${newG}g)`);
  }

  // Match "X lb" without grams
  const lbOnly = /(\d+\.?\d*)\s*lb/i;
  const lbMatch = ingredient.match(lbOnly);
  if (lbMatch) {
    const oldLb = parseFloat(lbMatch[1]);
    const newLb = (oldLb * 2).toFixed(1).replace(/\.0$/, "");
    return ingredient.replace(lbMatch[0], `${newLb} lb`);
  }

  // Match "Xg" or "X g"
  const gOnly = /(\d+\.?\d*)\s*g\b/i;
  const gMatch = ingredient.match(gOnly);
  if (gMatch) {
    const oldG = parseFloat(gMatch[1]);
    const newG = Math.round(oldG * 2);
    return ingredient.replace(gMatch[0], `${newG}g`);
  }

  return ingredient;
}

export async function POST(req: Request) {
  try {
    const { weekId, portions } = await req.json();

    if (!weekId || !portions) {
      return NextResponse.json({ error: "weekId y portions requeridos" }, { status: 400 });
    }

    const planSnap = await adminDb.collection("weeklyPlans").doc(weekId).get();
    if (!planSnap.exists) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const plan = planSnap.data() as WeeklyPlan;
    const fixes: { day: string; meal: string; title: string; changes: string[] }[] = [];

    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        const slot = plan.meals?.[day]?.[meal];
        if (!slot?.recipeId) continue;

        const recipeSnap = await adminDb.collection("recipes").doc(slot.recipeId).get();
        if (!recipeSnap.exists) continue;

        const recipe = recipeSnap.data()!;
        const ingredients: string[] = recipe.ingredients || [];
        const changes: string[] = [];
        let changed = false;

        const newIngredients = ingredients.map((ing) => {
          if (!isProteinIngredient(ing)) return ing;

          // Check if it looks like a per-person amount (0.5 lb or ~227g)
          const lbMatch = ing.match(/(\d+\.?\d*)\s*lb/i);
          if (lbMatch) {
            const lb = parseFloat(lbMatch[1]);
            // If it's 0.5 lb or less, it's likely per-person — double it
            if (lb <= 0.5) {
              const fixed = doubleQuantities(ing);
              if (fixed !== ing) {
                changes.push(`${ing} → ${fixed}`);
                changed = true;
                return fixed;
              }
            }
          }
          return ing;
        });

        if (changed) {
          await adminDb.collection("recipes").doc(slot.recipeId).update({ ingredients: newIngredients });
          fixes.push({
            day: DAY_LABELS[day],
            meal: MEAL_LABELS[meal],
            title: recipe.title,
            changes,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount: fixes.length,
      fixes,
    });
  } catch (error: any) {
    console.error("Error fixing portions:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Error" }, { status: 500 });
  }
}
