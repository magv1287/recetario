"use client";

import { useState } from "react";
import { WeeklyPlan, Recipe, DayOfWeek, MealType, DAYS_OF_WEEK, DAY_LABELS } from "@/lib/types";
import { MealCard } from "./MealCard";
import { SwapRecipeModal } from "./SwapRecipeModal";

interface WeeklyCalendarProps {
  plan: WeeklyPlan | null;
  recipes: Record<string, Recipe>;
  weekId: string;
  onToggleLock: (day: DayOfWeek, meal: MealType) => void;
  onPlanUpdated: () => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function WeeklyCalendar({ plan, recipes, weekId, onToggleLock, onPlanUpdated }: WeeklyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDay());
  const [swapTarget, setSwapTarget] = useState<{ day: DayOfWeek; meal: MealType } | null>(null);

  function getCurrentDay(): DayOfWeek {
    const jsDay = new Date().getDay();
    const map: Record<number, DayOfWeek> = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
    return map[jsDay];
  }

  const getRecipeForSlot = (day: DayOfWeek, meal: MealType): Recipe | null => {
    if (!plan?.meals?.[day]?.[meal]) return null;
    const recipeId = plan.meals[day][meal].recipeId;
    return recipes[recipeId] || null;
  };

  const isLocked = (day: DayOfWeek, meal: MealType): boolean => {
    return plan?.meals?.[day]?.[meal]?.locked ?? false;
  };

  if (!plan) {
    return null;
  }

  return (
    <>
      {/* Mobile: day tabs + vertical meal cards */}
      <div className="lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-5 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedDay === day
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] active:scale-95"
              }`}
            >
              {DAY_LABELS[day].slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="px-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--foreground)]">{DAY_LABELS[selectedDay]}</h3>
          {MEAL_TYPES.map((meal) => (
            <MealCard
              key={meal}
              mealType={meal}
              recipe={getRecipeForSlot(selectedDay, meal)}
              locked={isLocked(selectedDay, meal)}
              onToggleLock={() => onToggleLock(selectedDay, meal)}
              onSwap={() => setSwapTarget({ day: selectedDay, meal })}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full 7-column grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-3">
          {/* Day headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center pb-2">
              <p className="text-xs font-semibold text-[var(--muted-dark)] uppercase tracking-wider">{DAY_LABELS[day]}</p>
            </div>
          ))}

          {/* Meal rows */}
          {MEAL_TYPES.map((meal) => (
            DAYS_OF_WEEK.map((day) => (
              <MealCard
                key={`${day}-${meal}`}
                mealType={meal}
                recipe={getRecipeForSlot(day, meal)}
                locked={isLocked(day, meal)}
                onToggleLock={() => onToggleLock(day, meal)}
                onSwap={() => setSwapTarget({ day, meal })}
                compact
              />
            ))
          ))}
        </div>

        {/* Meal type labels on the left side are implied by the MealCard headers */}
      </div>

      {swapTarget && (
        <SwapRecipeModal
          day={swapTarget.day}
          meal={swapTarget.meal}
          currentRecipe={getRecipeForSlot(swapTarget.day, swapTarget.meal)}
          weekId={weekId}
          onClose={() => setSwapTarget(null)}
          onSwapped={onPlanUpdated}
        />
      )}
    </>
  );
}
