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
    <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
      {DIETS.map((diet) => {
        const isActive = active.includes(diet.name);
        return (
          <button
            key={diet.name}
            onClick={() => toggle(diet.name)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium border whitespace-nowrap transition-all shrink-0 ${
              isActive
                ? diet.color
                : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 active:scale-95"
            }`}
          >
            {diet.name}
          </button>
        );
      })}
    </div>
  );
}
