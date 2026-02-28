import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getGeminiModel, parseGeminiJson } from "@/lib/gemini";
import { getPrepGuidePrompt } from "@/lib/prompts";
import { WeeklyPlan, DAYS_OF_WEEK, MealType, DAY_LABELS } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };

export async function POST(req: Request) {
  try {
    const { weekId } = await req.json();

    if (!weekId) {
      return NextResponse.json({ error: "weekId requerido" }, { status: 400 });
    }

    const planSnap = await adminDb.collection("weeklyPlans").doc(weekId).get();
    if (!planSnap.exists) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const plan = planSnap.data() as WeeklyPlan;
    const recipeSummaries: string[] = [];

    const prepDays = DAYS_OF_WEEK.filter((d) => d !== "sunday");

    for (const day of prepDays) {
      for (const meal of MEAL_TYPES) {
        const slot = plan.meals?.[day]?.[meal];
        if (!slot?.recipeId) continue;

        try {
          const recipeSnap = await adminDb.collection("recipes").doc(slot.recipeId).get();
          if (recipeSnap.exists) {
            const r = recipeSnap.data()!;
            recipeSummaries.push(
              `${DAY_LABELS[day]} ${MEAL_LABELS[meal]}: ${r.title}\nIngredientes: ${(r.ingredients || []).join(", ")}`
            );
          }
        } catch {
          // skip
        }
      }
    }

    if (recipeSummaries.length === 0) {
      return NextResponse.json({ error: "No se encontraron recetas para preparar" }, { status: 400 });
    }

    const model = getGeminiModel();
    const prompt = getPrepGuidePrompt(recipeSummaries);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let data;
    try {
      data = parseGeminiJson(responseText);
    } catch {
      console.error("JSON parse error prep guide. Raw:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Error al procesar la guía. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const steps = (data.steps || []).map((step: any) => ({
      phase: step.phase || "",
      timing: step.timing || "",
      instructions: step.instructions || [],
    }));

    await adminDb.collection("prepGuides").doc(weekId).set({
      userId: plan.userId,
      steps,
      generatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, stepCount: steps.length });
  } catch (error: any) {
    console.error("Error generating prep guide:", error?.message || error);

    let userError = "Error al generar la guía de prep.";
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      userError = "Limite de uso de IA alcanzado. Espera un minuto e intenta de nuevo.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
