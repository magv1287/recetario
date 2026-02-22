import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getGeminiModel, parseGeminiJson } from "@/lib/gemini";
import { getShoppingListPrompt } from "@/lib/prompts";
import { WeeklyPlan, DAYS_OF_WEEK, MealType } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

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

    const allIngredients: string[] = [];

    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        const slot = plan.meals?.[day]?.[meal];
        if (!slot?.recipeId) continue;

        try {
          const recipeSnap = await adminDb.collection("recipes").doc(slot.recipeId).get();
          if (recipeSnap.exists) {
            const ingredients = recipeSnap.data()!.ingredients || [];
            allIngredients.push(...ingredients);
          }
        } catch {
          // skip individual recipe errors
        }
      }
    }

    if (allIngredients.length === 0) {
      return NextResponse.json({ error: "No se encontraron ingredientes en el plan" }, { status: 400 });
    }

    const model = getGeminiModel();
    const prompt = getShoppingListPrompt(allIngredients);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let data;
    try {
      data = parseGeminiJson(responseText);
    } catch {
      console.error("JSON parse error shopping list. Raw:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Error al procesar la lista de compras. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const items = (data.items || []).map((item: any) => ({
      name: item.name || "",
      quantity: item.quantity || "",
      category: item.category || "Otros",
      checked: false,
    }));

    await adminDb.collection("shoppingLists").doc(weekId).set({
      userId: plan.userId,
      items,
      syncedToBring: false,
      generatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, itemCount: items.length });
  } catch (error: any) {
    console.error("Error generating shopping list:", error?.message || error);

    let userError = "Error al generar la lista de compras.";
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      userError = "Limite de uso de IA alcanzado. Espera un minuto e intenta de nuevo.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
