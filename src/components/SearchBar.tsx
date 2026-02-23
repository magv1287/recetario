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
        className="absolute left-4 text-[var(--muted-dark)] pointer-events-none"
        size={18}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar recetas o ingredientes..."
        style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 text-[var(--foreground)] placeholder-[var(--muted-dark)] text-sm focus:outline-none focus:border-[var(--accent)]/40 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 text-[var(--muted-dark)] hover:text-[var(--muted)] p-1"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
