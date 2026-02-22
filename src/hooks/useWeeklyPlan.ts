"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WeeklyPlan, DayOfWeek, MealType, Recipe } from "@/lib/types";

export function getWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getNextWeekId(date: Date = new Date()): string {
  const next = new Date(date);
  next.setDate(next.getDate() + 7);
  return getWeekId(next);
}

export function getWeekDates(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

async function enrichRecipeImages(recipes: Record<string, Recipe>): Promise<void> {
  const needsImage = Object.entries(recipes)
    .filter(([, r]) => !r.imageUrl && r.source === "ai")
    .map(([id]) => id);

  if (needsImage.length === 0) return;

  let remaining = [...needsImage];

  while (remaining.length > 0) {
    try {
      const res = await fetch("/api/enrich-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: remaining }),
      });

      if (!res.ok) break;

      const data = await res.json();
      remaining = data.remaining || [];

      if (data.done) break;
    } catch {
      break;
    }
  }
}

export function useWeeklyPlan(userId: string | undefined, weekId: string) {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  const [loading, setLoading] = useState(true);
  const enrichingRef = useRef(false);

  useEffect(() => {
    if (!userId || !weekId) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, "weeklyPlans", weekId);
    const unsubscribe = onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as WeeklyPlan;
          setPlan(data);
          await loadRecipesForPlan(data);
        } else {
          setPlan(null);
          setRecipes({});
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching weekly plan:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, weekId]);

  const loadRecipesForPlan = async (plan: WeeklyPlan) => {
    const recipeIds = new Set<string>();
    for (const dayMeals of Object.values(plan.meals)) {
      if (dayMeals.breakfast?.recipeId) recipeIds.add(dayMeals.breakfast.recipeId);
      if (dayMeals.lunch?.recipeId) recipeIds.add(dayMeals.lunch.recipeId);
      if (dayMeals.dinner?.recipeId) recipeIds.add(dayMeals.dinner.recipeId);
    }

    const loaded: Record<string, Recipe> = {};
    await Promise.all(
      Array.from(recipeIds).map(async (id) => {
        try {
          const recipeDoc = await getDoc(doc(db, "recipes", id));
          if (recipeDoc.exists()) {
            loaded[id] = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
          }
        } catch (err) {
          console.error(`Error loading recipe ${id}:`, err);
        }
      })
    );
    setRecipes(loaded);

    if (!enrichingRef.current) {
      enrichingRef.current = true;
      enrichRecipeImages(loaded).finally(() => {
        enrichingRef.current = false;
      });
    }
  };

  const toggleLock = useCallback(
    async (day: DayOfWeek, meal: MealType) => {
      if (!plan || !userId) return;

      const updatedMeals = { ...plan.meals };
      const dayMeals = { ...updatedMeals[day] };
      dayMeals[meal] = { ...dayMeals[meal], locked: !dayMeals[meal].locked };
      updatedMeals[day] = dayMeals;

      const docRef = doc(db, "weeklyPlans", weekId);
      await setDoc(docRef, { ...plan, meals: updatedMeals }, { merge: true });
    },
    [plan, userId, weekId]
  );

  const clearMeal = useCallback(
    async (day: DayOfWeek, meal: MealType) => {
      if (!plan || !userId) return;

      const updatedMeals = { ...plan.meals };
      const dayMeals = { ...updatedMeals[day] };
      dayMeals[meal] = { recipeId: "", locked: true };
      updatedMeals[day] = dayMeals;

      const docRef = doc(db, "weeklyPlans", weekId);
      await setDoc(docRef, { ...plan, meals: updatedMeals }, { merge: true });
    },
    [plan, userId, weekId]
  );

  return { plan, recipes, loading, toggleLock, clearMeal };
}
