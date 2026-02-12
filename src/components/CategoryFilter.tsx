"use client";

import React from "react";
import { CATEGORIES } from "@/lib/categories";
import { Category } from "@/lib/types";

interface CategoryFilterProps {
  active: "Todas" | Category;
  onChange: (category: "Todas" | Category) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  const allCategories: { name: "Todas" | Category; emoji: string }[] = [
    { name: "Todas", emoji: "📖" },
    ...CATEGORIES,
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
      {allCategories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onChange(cat.name)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
            active === cat.name
              ? "bg-amber-500 border-amber-500 text-black"
              : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <span className="text-base">{cat.emoji}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}
