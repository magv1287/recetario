"use client";

import React from "react";
import { Recipe } from "@/lib/types";
import { getCategoryEmoji, getDietStyle } from "@/lib/categories";
import { Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group animate-fadeIn"
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
            <span className="text-5xl">{getCategoryEmoji(recipe.category)}</span>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-zinc-200 flex items-center gap-1">
          <span>{getCategoryEmoji(recipe.category)}</span>
          {recipe.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-zinc-100 line-clamp-1 mb-1.5">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
            {recipe.description}
          </p>
        )}

        {/* Diet tags */}
        {recipe.diets && recipe.diets.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
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

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-3 text-zinc-600 text-xs">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {recipe.ingredients?.length || 0} ingredientes
          </span>
          <span>{recipe.steps?.length || 0} pasos</span>
        </div>
      </div>
    </button>
  );
}
