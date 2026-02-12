"use client";

import React from "react";
import { DIETS } from "@/lib/categories";
import { Diet } from "@/lib/types";

interface DietFilterProps {
  active: Diet[];
  onChange: (diets: Diet[]) => void;
}

export function DietFilter({ active, onChange }: DietFilterProps) {
  const toggle = (diet: Diet) => {
    if (active.includes(diet)) {
      onChange(active.filter((d) => d !== diet));
    } else {
      onChange([...active, diet]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {DIETS.map((diet) => {
        const isActive = active.includes(diet.name);
        return (
          <button
            key={diet.name}
            onClick={() => toggle(diet.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0 ${
              isActive
                ? diet.color
                : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"
            }`}
          >
            {diet.name}
          </button>
        );
      })}
    </div>
  );
}
