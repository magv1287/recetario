import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getGeminiModel, parseGeminiJson } from "@/lib/gemini";
import { WeeklyPlan, DAYS_OF_WEEK, MealType, DAY_LABELS } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };

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
    const fixes: { recipeId: string; day: string; meal: string; title: string; oldIngredients: string[]; newIngredients: string[] }[] = [];

    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        const slot = plan.meals?.[day]?.[meal];
        if (!slot?.recipeId) continue;

        const recipeSnap = await adminDb.collection("recipes").doc(slot.recipeId).get();
        if (!recipeSnap.exists) continue;

        const recipe = recipeSnap.data()!;
        const ingredients: string[] = recipe.ingredients || [];

        const model = getGeminiModel();
        const prompt = `Revisa estos ingredientes de una receta que debe ser para ${portions} personas.

La regla es: 0.5 lb (227g) de proteína POR PERSONA por comida. Para ${portions} personas = ${(portions * 0.5).toFixed(1)} lb (${Math.round(portions * 227)}g) de proteína total.

Si la proteína (pollo, res, cerdo, pescado, camarones, pavo, etc.) tiene cantidades para 1 persona (ej: 0.5 lb / 227g), multiplícala por ${portions}.
Si ya tiene la cantidad correcta para ${portions} personas (ej: ${(portions * 0.5).toFixed(1)} lb / ${Math.round(portions * 227)}g), NO la cambies.
Para los demás ingredientes (vegetales, salsas, aceite, especias, huevos), ajústalos proporcionalmente si parecen ser para 1 persona.

Ingredientes actuales:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

Devuelve SOLO JSON:
{ "ingredients": ["ingrediente 1 corregido", "ingrediente 2 corregido", ...] }

Si todo está correcto, devuelve los ingredientes sin cambios. SOLO JSON, nada más.`;

        const result = await model.generateContent(prompt);
        const data = parseGeminiJson(result.response.text());
        const newIngredients: string[] = data.ingredients || ingredients;

        const changed = JSON.stringify(newIngredients) !== JSON.stringify(ingredients);
        if (changed) {
          await adminDb.collection("recipes").doc(slot.recipeId).update({ ingredients: newIngredients });
          fixes.push({
            recipeId: slot.recipeId,
            day: DAY_LABELS[day],
            meal: MEAL_LABELS[meal],
            title: recipe.title,
            oldIngredients: ingredients,
            newIngredients,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount: fixes.length,
      fixes: fixes.map((f) => ({ day: f.day, meal: f.meal, title: f.title })),
    });
  } catch (error: any) {
    console.error("Error fixing portions:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Error" }, { status: 500 });
  }
}
