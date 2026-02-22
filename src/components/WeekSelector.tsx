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
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="text-center min-w-[160px]">
        <p className="text-xs text-[var(--muted-dark)] font-medium uppercase tracking-wider">{weekId}</p>
        <p className="text-sm text-[var(--foreground)] font-semibold">{formatDateRange(weekId)}</p>
      </div>
      <button
        onClick={onNext}
        className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
