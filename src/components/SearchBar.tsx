"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Search
        className="absolute left-4 text-zinc-500 pointer-events-none"
        size={16}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar recetas o ingredientes..."
        style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
        className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 text-zinc-500 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
