import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getRecipeModel, getGeminiModel, parseGeminiJson } from "@/lib/gemini";
import { getWeeklyPlanPrompt, getShoppingListPrompt } from "@/lib/prompts";
import { syncToBring } from "@/lib/bring";
import { DAYS_OF_WEEK, MealType } from "@/lib/types";

export const maxDuration = 60;

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function getNextWeekId(): string {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + (7 - now.getDay()) + 1);
  const d = new Date(Date.UTC(next.getFullYear(), next.getMonth(), next.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekId = getNextWeekId();

    const existingPlan = await adminDb.collection("weeklyPlans").doc(weekId).get();
    if (existingPlan.exists) {
      await adminDb.collection("config").doc("cronStatus").set({
        lastRun: FieldValue.serverTimestamp(),
        weekId,
        success: true,
      });
      return NextResponse.json({ message: "Plan already exists", weekId });
    }

    const accessSnap = await adminDb.collection("config").doc("access").get();
    if (!accessSnap.exists) {
      return NextResponse.json({ error: "No access config found" }, { status: 500 });
    }

    let adminUserId = "";
    try {
      const prefsSnap = await adminDb.collection("userPrefs").get();
      prefsSnap.forEach((d) => {
        if (!adminUserId) adminUserId = d.id;
      });
    } catch {
      // fallback
    }

    if (!adminUserId) {
      const recipesSnap = await adminDb.collection("recipes").where("source", "==", "ai").get();
      recipesSnap.forEach((d) => {
        if (!adminUserId) adminUserId = d.data().userId;
      });
    }

    if (!adminUserId) {
      adminUserId = "cron-system";
    }

    const portions = 2;

    const existingTitles: string[] = [];
    try {
      const recipesSnap = await adminDb.collection("recipes").where("source", "==", "ai").get();
      recipesSnap.forEach((d) => {
        const title = d.data().title;
        if (title) existingTitles.push(title);
      });
    } catch {
      // non-critical
    }

    const recipeModel = getRecipeModel();
    const planPrompt = getWeeklyPlanPrompt(portions, existingTitles.slice(-50));
    const planResult = await recipeModel.generateContent(planPrompt);
    const planData = parseGeminiJson(planResult.response.text());

    if (!planData.meals) {
      throw new Error("Invalid plan data from AI");
    }

    const planMeals: Record<string, Record<string, { recipeId: string; locked: boolean }>> = {};
    const allIngredients: string[] = [];

    for (const day of DAYS_OF_WEEK) {
      planMeals[day] = {};

      for (const meal of MEAL_TYPES) {
        const recipeData = planData.meals[day]?.[meal];
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
          userId: adminUserId,
          createdAt: FieldValue.serverTimestamp(),
        });

        planMeals[day][meal] = {
          recipeId: recipeRef.id,
          locked: false,
        };

        allIngredients.push(...(recipeData.ingredients || []));
      }
    }

    await adminDb.collection("weeklyPlans").doc(weekId).set({
      userId: adminUserId,
      portions,
      status: "draft",
      generatedAt: FieldValue.serverTimestamp(),
      meals: planMeals,
    });

    if (allIngredients.length > 0) {
      try {
        const listModel = getGeminiModel();
        const listPrompt = getShoppingListPrompt(allIngredients);
        const listResult = await listModel.generateContent(listPrompt);
        const listData = parseGeminiJson(listResult.response.text());

        const items = (listData.items || []).map((item: any) => ({
          name: item.name || "",
          quantity: item.quantity || "",
          category: item.category || "Otros",
          checked: false,
        }));

        await adminDb.collection("shoppingLists").doc(weekId).set({
          userId: adminUserId,
          items,
          syncedToBring: false,
          generatedAt: FieldValue.serverTimestamp(),
        });

        try {
          const weekNum = weekId.split("-W")[1]?.replace(/^0/, "") || weekId;
          const listName = `Semana ${weekNum}`;
          const bringListId = await syncToBring(items, listName);
          await adminDb.collection("shoppingLists").doc(weekId).set({
            syncedToBring: true,
            bringListId,
          }, { merge: true });
        } catch (bringErr: any) {
          console.error("Bring! sync failed (non-critical):", bringErr?.message);
        }
      } catch (listErr: any) {
        console.error("Shopping list generation failed (non-critical):", listErr?.message);
      }
    }

    await adminDb.collection("config").doc("cronStatus").set({
      lastRun: FieldValue.serverTimestamp(),
      weekId,
      success: true,
    });

    return NextResponse.json({
      success: true,
      weekId,
      recipesCreated: Object.values(planMeals).reduce((sum, day) => sum + Object.keys(day).length, 0),
    });
  } catch (error: any) {
    console.error("Cron error:", error?.message || error);

    try {
      await adminDb.collection("config").doc("cronStatus").set({
        lastRun: FieldValue.serverTimestamp(),
        weekId: getNextWeekId(),
        success: false,
      });
    } catch {
      // ignore status update errors
    }

    return NextResponse.json({ error: error?.message || "Cron job failed" }, { status: 500 });
  }
}
