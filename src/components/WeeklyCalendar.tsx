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

const SHORT_DAY: Record<DayOfWeek, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

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

  if (!plan) return null;

  return (
    <>
      {/* Mobile: day selector + vertical cards */}
      <div className="lg:hidden">
        <div className="flex gap-1 mb-5">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2.5 rounded-xl text-center transition-all ${
                  isActive
                    ? "bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/20"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] active:scale-95"
                }`}
              >
                <span className={`text-[12px] font-bold ${isActive ? "" : ""}`}>{SHORT_DAY[day]}</span>
              </button>
            );
          })}
        </div>

        <h3 className="text-base font-bold text-[var(--foreground)] mb-3 pl-1">{DAY_LABELS[selectedDay]}</h3>

        <div className="space-y-3">
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

      {/* Desktop: full 7-column grid with images */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center pb-3 border-b border-[var(--border)]">
              <p className="text-[13px] font-bold text-[var(--foreground)] tracking-wide">{DAY_LABELS[day]}</p>
            </div>
          ))}

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
