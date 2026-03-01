"use client";

import React from "react";
import { X, Clock, ChefHat, Check } from "lucide-react";
import { PrepGuide } from "@/lib/types";

interface PrepGuideModalProps {
  guide: PrepGuide;
  onToggle: (phaseIndex: number, instructionIndex: number) => void;
  onClose: () => void;
}

export function PrepGuideModal({ guide, onToggle, onClose }: PrepGuideModalProps) {
  const totalItems = guide.steps.reduce((sum, s) => sum + s.instructions.length, 0);
  const checkedItems = guide.steps.reduce(
    (sum, s) => sum + (s.checked || []).filter(Boolean).length,
    0
  );
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <ChefHat className="text-[var(--accent)]" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Prep Domingo</h2>
              <p className="text-sm text-[var(--muted)]">
                {checkedItems}/{totalItems} pasos completados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] p-2 rounded-xl hover:bg-[var(--card-hover)] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--accent)] min-w-[36px] text-right">{progress}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {guide.steps.map((step, i) => {
            const checked = step.checked || new Array(step.instructions.length).fill(false);
            const phaseComplete = checked.length > 0 && checked.every(Boolean);
            const phaseDone = checked.filter(Boolean).length;

            return (
              <div
                key={i}
                className={`border rounded-xl p-5 transition-colors ${
                  phaseComplete
                    ? "bg-[var(--sage-soft)] border-[var(--sage)]/20"
                    : "bg-[var(--background)] border-[var(--border)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      phaseComplete
                        ? "bg-[var(--sage-soft)] text-[var(--sage)]"
                        : "bg-[var(--accent-soft)] text-[var(--accent)]"
                    }`}>
                      {phaseComplete ? <Check size={16} /> : i + 1}
                    </span>
                    <div>
                      <h3 className={`text-base font-bold transition-colors ${
                        phaseComplete ? "text-[var(--sage)]" : "text-[var(--foreground)]"
                      }`}>
                        {step.phase}
                      </h3>
                      <span className="text-xs text-[var(--muted-dark)]">{phaseDone}/{step.instructions.length}</span>
                    </div>
                  </div>
                  {step.timing && (
                    <span className="flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] shrink-0">
                      <Clock size={12} />
                      {step.timing}
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {step.instructions.map((instruction, j) => {
                    const isDone = checked[j];
                    return (
                      <li key={j}>
                        <button
                          onClick={() => onToggle(i, j)}
                          className="flex items-start gap-3 w-full text-left py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--card-hover)]/50 transition-colors active:scale-[0.99]"
                        >
                          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isDone
                              ? "bg-[var(--accent)] border-[var(--accent)]"
                              : "border-[var(--border-light)] bg-transparent"
                          }`}>
                            {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                          </span>
                          <span className={`text-sm leading-relaxed transition-colors ${
                            isDone ? "text-[var(--muted-dark)] line-through" : "text-[var(--muted)]"
                          }`}>
                            {instruction}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
