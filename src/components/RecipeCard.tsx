"use client";

import React from "react";
import { Recipe } from "@/lib/types";
import { getCategoryEmoji, getDietStyle } from "@/lib/categories";
import { Heart } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
}

export function RecipeCard({ recipe, onClick, isFavorite = false, onToggleFavorite }: RecipeCardProps) {
  return (
    <div className="relative bg-[var(--card)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow)] transition-all group animate-fadeIn">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(recipe.id);
        }}
        className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm p-2 rounded-full transition-all active:scale-90 hover:bg-black/60"
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          size={16}
          className={isFavorite ? "text-red-500 fill-red-500" : "text-white/60"}
        />
      </button>

      <button
        onClick={onClick}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        <div className="aspect-[16/10] w-full bg-[var(--background)] relative overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-soft)] to-transparent">
              <span className="text-5xl opacity-60">{getCategoryEmoji(recipe.category)}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--card)] to-transparent" />
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
            <span>{getCategoryEmoji(recipe.category)}</span>
            {recipe.category}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-[var(--foreground)] line-clamp-2 mb-1.5 leading-snug">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-[var(--muted-dark)] text-[13px] line-clamp-2 mb-3 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {recipe.diets && recipe.diets.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {recipe.diets.map((diet) => (
                <span
                  key={diet}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getDietStyle(diet)}`}
                >
                  {diet}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-[var(--muted-dark)] text-[12px]">
            <span>{recipe.ingredients?.length || 0} ingredientes</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-light)]" />
            <span>{recipe.steps?.length || 0} pasos</span>
          </div>
        </div>
      </button>
    </div>
  );
}
