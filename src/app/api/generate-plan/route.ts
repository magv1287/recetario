import { NextResponse } from "next/server";
import { collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getRecipeModel, parseGeminiJson } from "@/lib/gemini";
import { getWeeklyPlanPrompt } from "@/lib/prompts";
import { searchFoodImage } from "@/lib/images";
import { DayOfWeek, MealType, DAYS_OF_WEEK } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function POST(req: Request) {
  try {
    const { weekId, portions, regenerate, userId } = await req.json();

    if (!weekId || !userId) {
      return NextResponse.json({ error: "Faltan parametros requeridos" }, { status: 400 });
    }

    const portionCount = portions || 2;

    const existingTitles: string[] = [];
    if (!regenerate) {
      try {
        const recipesSnap = await getDocs(
          query(collection(db, "recipes"), where("source", "==", "ai"))
        );
        recipesSnap.forEach((d) => {
          const title = d.data().title;
          if (title) existingTitles.push(title);
        });
      } catch {
        // Non-critical
      }
    }

    const model = getRecipeModel();
    const prompt = getWeeklyPlanPrompt(portionCount, existingTitles.slice(-50));

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let data;
    try {
      data = parseGeminiJson(responseText);
    } catch {
      console.error("JSON parse error. Raw:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "La IA no pudo generar el plan. Intenta de nuevo." },
        { status: 500 }
      );
    }

    if (!data.meals) {
      return NextResponse.json(
        { error: "Formato de respuesta invalido" },
        { status: 500 }
      );
    }

    const planMeals: Record<string, Record<string, { recipeId: string; locked: boolean }>> = {};

    const recipeEntries: { day: DayOfWeek; meal: MealType; data: any }[] = [];
    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        const recipeData = data.meals[day]?.[meal];
        if (recipeData) {
          recipeEntries.push({ day, meal, data: recipeData });
        }
      }
    }

    const images = await Promise.allSettled(
      recipeEntries.map((entry) =>
        searchFoodImage(entry.data.title || entry.data.category || "food")
      )
    );

    for (let i = 0; i < recipeEntries.length; i++) {
      const { day, meal, data: recipeData } = recipeEntries[i];
      const imgResult = images[i];
      const imageUrl = imgResult.status === "fulfilled" ? imgResult.value : "";

      if (!planMeals[day]) planMeals[day] = {};

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
        userId,
        createdAt: serverTimestamp(),
      });

      planMeals[day][meal] = {
        recipeId: recipeDoc.id,
        locked: false,
      };
    }

    await setDoc(doc(db, "weeklyPlans", weekId), {
      userId,
      portions: portionCount,
      status: "draft",
      generatedAt: serverTimestamp(),
      meals: planMeals,
    });

    return NextResponse.json({ success: true, weekId });
  } catch (error: any) {
    console.error("Error generating plan:", error?.message || error);

    let userError = "Error al generar el plan semanal. Intenta de nuevo.";
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      userError = "Limite de uso de IA alcanzado. Espera un minuto e intenta de nuevo.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
