"use client";

import { useState, useEffect } from "react";
import { WeeklyPlan, Recipe, DayOfWeek, MealType, DAYS_OF_WEEK } from "@/lib/types";
import { MealCard } from "./MealCard";
import { SwapRecipeModal } from "./SwapRecipeModal";
import { getWeekDates } from "@/hooks/useWeeklyPlan";

interface WeeklyCalendarProps {
  plan: WeeklyPlan | null;
  recipes: Record<string, Recipe>;
  weekId: string;
  onToggleLock: (day: DayOfWeek, meal: MealType) => void;
  onClearMeal: (day: DayOfWeek, meal: MealType) => void;
  onPlanUpdated: () => void;
}

const WEEKEND_DAYS: DayOfWeek[] = ["saturday", "sunday"];

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

const DAY_INDEX: Record<DayOfWeek, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

const MEAL_END_HOUR: Record<MealType, number> = {
  breakfast: 10,
  lunch: 16,
  dinner: 20,
};

function getDayDate(weekId: string, day: DayOfWeek): Date {
  const { start } = getWeekDates(weekId);
  const d = new Date(start);
  d.setDate(d.getDate() + DAY_INDEX[day]);
  return d;
}

function isMealPast(weekId: string, day: DayOfWeek, meal: MealType, now: Date): boolean {
  const dayDate = getDayDate(weekId, day);
  const mealEnd = new Date(dayDate);
  mealEnd.setHours(MEAL_END_HOUR[meal], 0, 0, 0);
  return now > mealEnd;
}

function isDayFullyPast(weekId: string, day: DayOfWeek, now: Date): boolean {
  return isMealPast(weekId, day, "dinner", now);
}

export function WeeklyCalendar({ plan, recipes, weekId, onToggleLock, onClearMeal, onPlanUpdated }: WeeklyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDay());
  const [swapTarget, setSwapTarget] = useState<{ day: DayOfWeek; meal: MealType } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  function getCurrentDay(): DayOfWeek {
    const jsDay = new Date().getDay();
    const map: Record<number, DayOfWeek> = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
    return map[jsDay];
  }

  const getRecipeForSlot = (day: DayOfWeek, meal: MealType): Recipe | null => {
    if (!plan?.meals?.[day]?.[meal]) return null;
    const recipeId = plan.meals[day][meal].recipeId;
    if (!recipeId) return null;
    return recipes[recipeId] || null;
  };

  const isCheatMeal = (day: DayOfWeek, meal: MealType): boolean => {
    const slot = plan?.meals?.[day]?.[meal];
    return !!slot && slot.recipeId === "";
  };

  const canClear = (day: DayOfWeek, meal: MealType): boolean => {
    return WEEKEND_DAYS.includes(day) && meal === "dinner";
  };

  const isLocked = (day: DayOfWeek, meal: MealType): boolean => {
    return plan?.meals?.[day]?.[meal]?.locked ?? false;
  };

  const formatDayNumber = (day: DayOfWeek): string => {
    const d = getDayDate(weekId, day);
    return String(d.getDate());
  };

  if (!plan) return null;

  return (
    <>
      {/* Mobile: day selector + vertical cards */}
      <div className="lg:hidden">
        <div className="flex gap-1 mb-5">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDay === day;
            const dayPast = isDayFullyPast(weekId, day, now);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                  isActive
                    ? "bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/20"
                    : dayPast
                    ? "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-dark)]/50 opacity-50"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] active:scale-95"
                }`}
              >
                <span className="text-[11px] font-bold block">{SHORT_DAY[day]}</span>
                <span className={`text-[13px] font-bold block ${isActive ? "text-black" : dayPast ? "text-[var(--muted-dark)]/50" : "text-[var(--foreground)]"}`}>
                  {formatDayNumber(day)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {MEAL_TYPES.map((meal) => (
            <MealCard
              key={meal}
              mealType={meal}
              recipe={getRecipeForSlot(selectedDay, meal)}
              locked={isLocked(selectedDay, meal)}
              onToggleLock={() => onToggleLock(selectedDay, meal)}
              onSwap={() => setSwapTarget({ day: selectedDay, meal })}
              isPast={isMealPast(weekId, selectedDay, meal, now)}
              isCheatMeal={isCheatMeal(selectedDay, meal)}
              onClear={canClear(selectedDay, meal) ? () => onClearMeal(selectedDay, meal) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full 7-column grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayPast = isDayFullyPast(weekId, day, now);
            const isToday = getDayDate(weekId, day).toDateString() === now.toDateString();
            return (
              <div key={day} className={`text-center pb-3 border-b ${isToday ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
                <p className={`text-[11px] font-bold tracking-wide uppercase ${dayPast ? "text-[var(--muted-dark)]/50" : "text-[var(--muted)]"}`}>
                  {SHORT_DAY[day]}
                </p>
                <p className={`text-[18px] font-bold ${isToday ? "text-[var(--accent)]" : dayPast ? "text-[var(--muted-dark)]/50" : "text-[var(--foreground)]"}`}>
                  {formatDayNumber(day)}
                </p>
              </div>
            );
          })}

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
                isPast={isMealPast(weekId, day, meal, now)}
                isCheatMeal={isCheatMeal(day, meal)}
                onClear={canClear(day, meal) ? () => onClearMeal(day, meal) : undefined}
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
