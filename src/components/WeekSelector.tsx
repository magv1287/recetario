"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekDates } from "@/hooks/useWeeklyPlan";

interface WeekSelectorProps {
  weekId: string;
  onPrev: () => void;
  onNext: () => void;
}

function formatDateRange(weekId: string): string {
  const { start, end } = getWeekDates(weekId);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = start.toLocaleDateString("es-ES", opts);
  const e = end.toLocaleDateString("es-ES", opts);
  return `${s} – ${e}`;
}

export function WeekSelector({ weekId, onPrev, onNext }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors shadow-[var(--shadow-sm)]"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="text-center min-w-[140px]">
        <p className="text-[10px] text-[var(--muted-dark)] font-semibold uppercase tracking-wider">{weekId}</p>
        <p className="text-sm text-[var(--foreground)] font-bold">{formatDateRange(weekId)}</p>
      </div>
      <button
        onClick={onNext}
        className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors shadow-[var(--shadow-sm)]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
