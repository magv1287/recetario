"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex items-center w-full">
      <Search
        className="absolute left-4 text-zinc-500 pointer-events-none"
        size={18}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar recetas o ingredientes..."
        style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
        className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-3.5 text-zinc-200 placeholder-zinc-500 text-base focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 text-zinc-500 hover:text-zinc-300 p-1"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
