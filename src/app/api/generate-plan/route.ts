import { NextResponse } from "next/server";
import { adminDb, checkAdminReady } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getRecipeModel, parseGeminiJson } from "@/lib/gemini";
import { getWeeklyPlanPrompt } from "@/lib/prompts";
import { MealType, DAYS_OF_WEEK } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function POST(req: Request) {
  try {
    const adminError = checkAdminReady();
    if (adminError) {
      console.error("Admin SDK not ready:", adminError);
      return NextResponse.json(
        { error: `Configuracion del servidor incompleta: ${adminError}` },
        { status: 500 }
      );
    }

    const { weekId, portions, regenerate, userId } = await req.json();

    if (!weekId || !userId) {
      return NextResponse.json({ error: "Faltan parametros requeridos" }, { status: 400 });
    }

    // Verify Firestore connection before calling Gemini (fail-fast)
    try {
      await adminDb.collection("recipes").limit(1).get();
    } catch (fsErr: any) {
      console.error("Firestore connection failed:", fsErr?.message);
      return NextResponse.json(
        { error: "Error de conexion a la base de datos. Verifica FIREBASE_SERVICE_ACCOUNT_KEY." },
        { status: 500 }
      );
    }

    const portionCount = portions || 2;

    const existingTitles: string[] = [];
    if (!regenerate) {
      try {
        const recipesSnap = await adminDb.collection("recipes").where("source", "==", "ai").get();
        recipesSnap.forEach((d) => {
          const title = d.data().title;
          if (title) existingTitles.push(title);
        });
      } catch {
        // Non-critical
      }
    }

    // Call Gemini only after Firestore is confirmed working
    const model = getRecipeModel();
    const prompt = getWeeklyPlanPrompt(portionCount, existingTitles.slice(-50));

    let responseText: string;
    try {
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    } catch (aiErr: any) {
      console.error("Gemini API error:", aiErr?.message);
      const msg = aiErr?.message || "";
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return NextResponse.json(
          { error: "Limite de uso de IA alcanzado. Espera 1-2 minutos e intenta de nuevo." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error de IA: ${msg.substring(0, 100)}` },
        { status: 500 }
      );
    }

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
    const createdRecipeIds: string[] = [];

    for (const day of DAYS_OF_WEEK) {
      planMeals[day] = {};

      for (const meal of MEAL_TYPES) {
        const recipeData = data.meals[day]?.[meal];
        if (!recipeData) continue;

        const recipeRef = await adminDb.collection("recipes").add({
          title: recipeData.title || "Sin titulo",
          description: recipeData.description || "",
          category: recipeData.category || "Otros",
          diets: recipeData.diets || ["Low Carb"],
          ingredients: recipeData.ingredients || [],
          steps: recipeData.steps || [],
          imageUrl: "",
          source: "ai",
          mealType: meal,
          macros: recipeData.macros || null,
          userId,
          createdAt: FieldValue.serverTimestamp(),
        });

        createdRecipeIds.push(recipeRef.id);

        planMeals[day][meal] = {
          recipeId: recipeRef.id,
          locked: false,
        };
      }
    }

    await adminDb.collection("weeklyPlans").doc(weekId).set({
      userId,
      portions: portionCount,
      status: "draft",
      generatedAt: FieldValue.serverTimestamp(),
      meals: planMeals,
    });

    return NextResponse.json({ success: true, weekId, recipeIds: createdRecipeIds });
  } catch (error: any) {
    console.error("Error generating plan:", error?.message || error);
    return NextResponse.json(
      { error: `Error inesperado: ${(error?.message || "desconocido").substring(0, 150)}` },
      { status: 500 }
    );
  }
}
