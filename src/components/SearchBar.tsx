"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        size={18}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar recetas o ingredientes..."
        className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
