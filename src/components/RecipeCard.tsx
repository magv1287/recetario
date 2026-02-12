"use client";

import React from "react";
import { Recipe } from "@/lib/types";
import { getCategoryEmoji, getDietStyle } from "@/lib/categories";
import { Clock, Heart } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
}

export function RecipeCard({ recipe, onClick, isFavorite = false, onToggleFavorite }: RecipeCardProps) {
  return (
    <div className="relative bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group animate-fadeIn">
      {/* Favorite button - always visible, top right of image */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(recipe.id);
        }}
        className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm p-2.5 rounded-full transition-all active:scale-90 hover:bg-black/70"
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          size={18}
          className={isFavorite ? "text-red-500 fill-red-500" : "text-white/70"}
        />
      </button>

      {/* Clickable area */}
      <button
        onClick={onClick}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        {/* Image */}
        <div className="aspect-[16/10] w-full bg-zinc-900 relative overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <span className="text-6xl">{getCategoryEmoji(recipe.category)}</span>
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <span>{getCategoryEmoji(recipe.category)}</span>
            {recipe.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-zinc-100 line-clamp-2 mb-2 leading-snug">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-zinc-500 text-sm line-clamp-2 mb-4 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Diet tags */}
          {recipe.diets && recipe.diets.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {recipe.diets.map((diet) => (
                <span
                  key={diet}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDietStyle(diet)}`}
                >
                  {diet}
                </span>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {recipe.ingredients?.length || 0} ingredientes
            </span>
            <span>{recipe.steps?.length || 0} pasos</span>
          </div>
        </div>
      </button>
    </div>
  );
}
