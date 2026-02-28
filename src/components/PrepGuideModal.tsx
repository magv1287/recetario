"use client";

import React from "react";
import { X, Clock, ChefHat } from "lucide-react";
import { PrepGuide } from "@/lib/types";

interface PrepGuideModalProps {
  guide: PrepGuide;
  onClose: () => void;
}

export function PrepGuideModal({ guide, onClose }: PrepGuideModalProps) {
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
                {guide.steps.length} fases de preparacion
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

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {guide.steps.map((step, i) => (
            <div
              key={i}
              className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    {step.phase}
                  </h3>
                </div>
                {step.timing && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] shrink-0">
                    <Clock size={12} />
                    {step.timing}
                  </span>
                )}
              </div>
              <ul className="space-y-2.5">
                {step.instructions.map((instruction, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-[var(--muted)] text-sm leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
