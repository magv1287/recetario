"use client";

import { Recipe, MealType, MEAL_LABELS } from "@/lib/types";
import { Lock, Unlock, RefreshCw, ChefHat, Flame, Wheat, Drumstick, Pizza } from "lucide-react";
import { useRouter } from "next/navigation";

interface MealCardProps {
  mealType: MealType;
  recipe: Recipe | null;
  locked: boolean;
  onToggleLock: () => void;
  onSwap: () => void;
  compact?: boolean;
  isPast?: boolean;
  isCheatMeal?: boolean;
  onClear?: () => void;
}

const mealColors: Record<MealType, string> = {
  breakfast: "text-amber-400",
  lunch: "text-emerald-400",
  dinner: "text-violet-400",
};

const mealBgColors: Record<MealType, string> = {
  breakfast: "bg-amber-400/8",
  lunch: "bg-emerald-400/8",
  dinner: "bg-violet-400/8",
};

const mealBorderColors: Record<MealType, string> = {
  breakfast: "border-amber-400/15",
  lunch: "border-emerald-400/15",
  dinner: "border-violet-400/15",
};

export function MealCard({ mealType, recipe, locked, onToggleLock, onSwap, compact, isPast, isCheatMeal, onClear }: MealCardProps) {
  const router = useRouter();
  const pastClass = isPast ? "opacity-40 saturate-[0.3]" : "";

  if (isCheatMeal) {
    return (
      <div className={`bg-[var(--card)] rounded-xl shadow-[var(--shadow-sm)] ${compact ? "p-4" : "p-5"} flex items-center justify-center min-h-[80px] ${pastClass}`}>
        <div className="text-center">
          <Pizza size={compact ? 22 : 28} className="text-amber-400 mx-auto mb-1.5" />
          <p className={`${compact ? "text-[12px]" : "text-[14px]"} font-bold text-amber-400`}>Cheat Meal</p>
          <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-[var(--muted-dark)] mt-0.5`}>Disfruten!</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className={`bg-[var(--card)] border border-dashed border-[var(--border)] rounded-xl ${compact ? "p-4" : "p-5"} flex items-center justify-center min-h-[80px] ${pastClass}`}>
        <div className="text-center">
          <ChefHat size={compact ? 18 : 22} className="text-[var(--muted-dark)] mx-auto mb-1.5" />
          <p className="text-[12px] text-[var(--muted-dark)] font-medium">{MEAL_LABELS[mealType]}</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-[var(--card)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow)] transition-all group ${pastClass}`}>
        <div className={`flex items-center justify-between px-3 py-1.5 ${mealBgColors[mealType]} border-b ${mealBorderColors[mealType]}`}>
          <span className={`text-[11px] font-bold uppercase tracking-wide ${mealColors[mealType]}`}>{MEAL_LABELS[mealType]}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-1 rounded text-[var(--muted-dark)] hover:text-[var(--muted)] transition-colors" title={locked ? "Desbloquear" : "Bloquear"}>
              {locked ? <Lock size={11} /> : <Unlock size={11} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onSwap(); }} className="p-1 rounded text-[var(--muted-dark)] hover:text-[var(--accent)] transition-colors" title="Cambiar receta">
              <RefreshCw size={11} />
            </button>
            {onClear && (
              <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-1 rounded text-[var(--muted-dark)] hover:text-amber-400 transition-colors" title="Cheat Meal">
                <Pizza size={11} />
              </button>
            )}
          </div>
        </div>

        <button onClick={() => router.push(`/recipe/${recipe.id}`)} className="w-full text-left active:bg-[var(--card-hover)] transition-colors">
          {recipe.imageUrl && (
            <div className="w-full aspect-[16/9] overflow-hidden">
              <img src={recipe.imageUrl} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? "grayscale" : ""}`} loading="lazy" />
            </div>
          )}
          <div className="p-3">
            <p className="text-[13px] font-semibold text-[var(--foreground)] leading-snug line-clamp-2 mb-1.5">
              {recipe.title}
            </p>
            {recipe.macros && (
              <div className="flex items-center gap-2 text-[10px] text-[var(--muted-dark)]">
                <span className="flex items-center gap-0.5"><Drumstick size={9} />{recipe.macros.protein}g</span>
                <span className="flex items-center gap-0.5"><Wheat size={9} />{recipe.macros.carbs}g</span>
                <span className="flex items-center gap-0.5"><Flame size={9} />{recipe.macros.calories}</span>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--card)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow)] transition-all group ${pastClass}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${mealBgColors[mealType]} border-b ${mealBorderColors[mealType]}`}>
        <span className={`text-[12px] font-bold uppercase tracking-wide ${mealColors[mealType]}`}>{MEAL_LABELS[mealType]}</span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-1.5 rounded-lg text-[var(--muted-dark)] hover:text-[var(--muted)] hover:bg-white/5 transition-colors" title={locked ? "Desbloquear" : "Bloquear"}>
            {locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSwap(); }} className="p-1.5 rounded-lg text-[var(--muted-dark)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors" title="Cambiar receta">
            <RefreshCw size={14} />
          </button>
          {onClear && (
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-1.5 rounded-lg text-[var(--muted-dark)] hover:text-amber-400 hover:bg-amber-400/10 transition-colors" title="Cheat Meal">
              <Pizza size={14} />
            </button>
          )}
        </div>
      </div>

      <button onClick={() => router.push(`/recipe/${recipe.id}`)} className="w-full text-left active:bg-[var(--card-hover)] transition-colors">
        {recipe.imageUrl && (
          <div className="w-full aspect-[2/1] overflow-hidden">
            <img src={recipe.imageUrl} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? "grayscale" : ""}`} loading="lazy" />
          </div>
        )}
        <div className="p-4">
          <p className="text-[15px] font-semibold text-[var(--foreground)] leading-snug line-clamp-2 mb-2">
            {recipe.title}
          </p>
          {recipe.macros && (
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Drumstick size={11} />{recipe.macros.protein}g prot
              </span>
              <span className="flex items-center gap-1 text-amber-400/70 font-medium">
                <Wheat size={11} />{recipe.macros.carbs}g carb
              </span>
              <span className="flex items-center gap-1 text-[var(--muted-dark)] font-medium">
                <Flame size={11} />{recipe.macros.calories} kcal
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
