import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getRecipeModel, parseGeminiJson } from "@/lib/gemini";
import { getSwapRecipePrompt } from "@/lib/prompts";
import { searchFoodImage } from "@/lib/images";
import { WeeklyPlan, DayOfWeek, MealType, DAYS_OF_WEEK } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function POST(req: Request) {
  try {
    const { weekId, day, meal, currentRecipeTitle } = await req.json();

    if (!weekId || !day || !meal) {
      return NextResponse.json({ error: "Faltan parametros requeridos" }, { status: 400 });
    }

    const planSnap = await getDoc(doc(db, "weeklyPlans", weekId));
    if (!planSnap.exists()) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const plan = planSnap.data() as WeeklyPlan;

    const existingTitles: string[] = [];
    for (const d of DAYS_OF_WEEK) {
      for (const m of MEAL_TYPES) {
        const slot = plan.meals?.[d]?.[m];
        if (slot?.recipeId) {
          try {
            const recipeSnap = await getDoc(doc(db, "recipes", slot.recipeId));
            if (recipeSnap.exists()) {
              existingTitles.push(recipeSnap.data().title);
            }
          } catch {
            // skip
          }
        }
      }
    }

    const model = getRecipeModel();
    const prompt = getSwapRecipePrompt(
      meal as MealType,
      plan.portions || 2,
      currentRecipeTitle || "",
      existingTitles
    );

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let recipeData;
    try {
      recipeData = parseGeminiJson(responseText);
    } catch {
      console.error("JSON parse error on swap. Raw:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "La IA no pudo generar una alternativa. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const imageUrl = await searchFoodImage(recipeData.title || recipeData.category || "food");

    const recipeDoc = await addDoc(collection(db, "recipes"), {
      title: recipeData.title || "Sin titulo",
      description: recipeData.description || "",
      category: recipeData.category || "Otros",
      diets: recipeData.diets || ["Low Carb"],
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      imageUrl,
      source: "ai",
      mealType: meal,
      macros: recipeData.macros || null,
      userId: plan.userId,
      createdAt: serverTimestamp(),
    });

    const updatedMeals = { ...plan.meals };
    if (!updatedMeals[day as DayOfWeek]) {
      updatedMeals[day as DayOfWeek] = {} as any;
    }
    (updatedMeals[day as DayOfWeek] as any)[meal] = {
      recipeId: recipeDoc.id,
      locked: false,
    };

    await updateDoc(doc(db, "weeklyPlans", weekId), { meals: updatedMeals });

    return NextResponse.json({ success: true, recipeId: recipeDoc.id });
  } catch (error: any) {
    console.error("Error swapping recipe:", error?.message || error);

    let userError = "Error al cambiar la receta. Intenta de nuevo.";
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      userError = "Limite de uso de IA alcanzado. Espera un minuto e intenta de nuevo.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
