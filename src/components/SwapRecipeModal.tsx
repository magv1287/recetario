"use client";

import { useState } from "react";
import { X, Loader2, RefreshCw } from "lucide-react";
import { DayOfWeek, MealType, DAY_LABELS, MEAL_LABELS, Recipe } from "@/lib/types";

interface SwapRecipeModalProps {
  day: DayOfWeek;
  meal: MealType;
  currentRecipe: Recipe | null;
  weekId: string;
  onClose: () => void;
  onSwapped: () => void;
}

export function SwapRecipeModal({ day, meal, currentRecipe, weekId, onClose, onSwapped }: SwapRecipeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSwap = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/swap-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId,
          day,
          meal,
          currentRecipeTitle: currentRecipe?.title || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cambiar la receta");
      }

      onSwapped();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al cambiar la receta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-sm animate-scaleIn">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--foreground)]">Cambiar receta</h3>
          <button onClick={onClose} className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5">
            <p className="text-xs text-[var(--muted-dark)] font-medium">
              {DAY_LABELS[day]} · {MEAL_LABELS[meal]}
            </p>
            {currentRecipe && (
              <p className="text-sm text-[var(--foreground)] font-semibold mt-1">{currentRecipe.title}</p>
            )}
          </div>

          <p className="text-sm text-[var(--muted)]">
            Se generara una nueva receta con las mismas restricciones dieteticas para reemplazar esta comida.
          </p>

          {error && (
            <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 animate-fadeIn">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[var(--border)] rounded-xl text-[var(--muted)] text-sm font-medium hover:bg-[var(--background)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSwap}
              disabled={loading}
              className="flex-1 py-3 bg-[var(--accent)] rounded-xl text-black text-sm font-bold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={15} />
              )}
              {loading ? "Generando..." : "Cambiar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
