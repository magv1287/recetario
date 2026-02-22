"use client";

import { Recipe, MealType, MEAL_LABELS } from "@/lib/types";
import { Lock, Unlock, RefreshCw, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";

interface MealCardProps {
  mealType: MealType;
  recipe: Recipe | null;
  locked: boolean;
  onToggleLock: () => void;
  onSwap: () => void;
  compact?: boolean;
}

const mealColors: Record<MealType, string> = {
  breakfast: "text-amber-400",
  lunch: "text-[var(--sage)]",
  dinner: "text-purple-400",
};

const mealBgColors: Record<MealType, string> = {
  breakfast: "bg-amber-400/8",
  lunch: "bg-[var(--sage-soft)]",
  dinner: "bg-purple-400/8",
};

export function MealCard({ mealType, recipe, locked, onToggleLock, onSwap, compact }: MealCardProps) {
  const router = useRouter();

  if (!recipe) {
    return (
      <div className={`bg-[var(--card)] border border-dashed border-[var(--border-light)] rounded-xl ${compact ? "p-3" : "p-4"} flex items-center justify-center`}>
        <div className="text-center">
          <ChefHat size={compact ? 16 : 20} className="text-[var(--border-light)] mx-auto mb-1" />
          <p className="text-[11px] text-[var(--muted-dark)]">{MEAL_LABELS[mealType]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-light)] transition-all group ${compact ? "" : ""}`}>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${mealBgColors[mealType]} border-b border-[var(--border)]`}>
        <span className={`text-[11px] font-semibold ${mealColors[mealType]}`}>{MEAL_LABELS[mealType]}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            className="p-1 rounded text-[var(--muted-dark)] hover:text-[var(--muted)] transition-colors"
            title={locked ? "Desbloquear" : "Bloquear"}
          >
            {locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSwap(); }}
            className="p-1 rounded text-[var(--muted-dark)] hover:text-[var(--accent)] transition-colors"
            title="Cambiar receta"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push(`/recipe/${recipe.id}`)}
        className={`w-full text-left ${compact ? "p-2.5" : "p-3"} active:bg-[var(--card-hover)] transition-colors`}
      >
        <div className="flex items-start gap-2.5">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt=""
              className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg object-cover shrink-0`}
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-[var(--foreground)] ${compact ? "text-[11px] leading-tight line-clamp-2" : "text-[13px] leading-snug line-clamp-2"}`}>
              {recipe.title}
            </p>
            {recipe.macros && !compact && (
              <p className="text-[10px] text-[var(--muted-dark)] mt-1">
                {recipe.macros.protein}g prot · {recipe.macros.carbs}g carb · {recipe.macros.calories} kcal
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
