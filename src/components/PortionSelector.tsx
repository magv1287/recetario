"use client";

import { Minus, Plus, Users } from "lucide-react";

interface PortionSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

export function PortionSelector({ value, onChange }: PortionSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Users size={15} className="text-[var(--muted-dark)]" />
      <span className="text-xs text-[var(--muted-dark)] font-medium">Porciones</span>
      <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-30"
          disabled={value <= 1}
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-bold text-[var(--foreground)] min-w-[24px] text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(10, value + 1))}
          className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-30"
          disabled={value >= 10}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
