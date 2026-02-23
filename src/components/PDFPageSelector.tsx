"use client";

import React, { useState } from "react";
import { FileText, ChevronRight } from "lucide-react";

interface PDFPageSelectorProps {
  totalPages: number;
  fileName: string;
  onConfirm: (pages: string | null) => void;
  onCancel: () => void;
}

export function PDFPageSelector({
  totalPages,
  fileName,
  onConfirm,
  onCancel,
}: PDFPageSelectorProps) {
  const [mode, setMode] = useState<"all" | "range" | "specific">("all");
  const [rangeText, setRangeText] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const handleConfirm = () => {
    switch (mode) {
      case "all":
        onConfirm(null);
        break;
      case "range":
        if (!rangeText.trim()) return;
        onConfirm(rangeText.trim());
        break;
      case "specific":
        if (selectedPages.size === 0) return;
        onConfirm(Array.from(selectedPages).sort((a, b) => a - b).join(","));
        break;
    }
  };

  const togglePage = (page: number) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(page)) {
      newSet.delete(page);
    } else {
      newSet.add(page);
    }
    setSelectedPages(newSet);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3 p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <FileText className="text-[var(--accent)] shrink-0" size={20} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {fileName}
          </p>
          <p className="text-xs text-[var(--muted-dark)]">{totalPages} páginas</p>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Este PDF tiene {totalPages} páginas. ¿Cuáles quieres procesar?
      </p>

      <div className="space-y-2">
        <button
          onClick={() => setMode("all")}
          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
            mode === "all"
              ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-light)]"
          }`}
        >
          <span className="font-medium">Todas las páginas</span>
          <span className="text-xs block mt-0.5 opacity-70">
            Procesar las {totalPages} páginas completas
          </span>
        </button>

        <button
          onClick={() => setMode("range")}
          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
            mode === "range"
              ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-light)]"
          }`}
        >
          <span className="font-medium">Rango de páginas</span>
          <span className="text-xs block mt-0.5 opacity-70">
            Ej: 1-5, 8, 12-15
          </span>
        </button>

        <button
          onClick={() => setMode("specific")}
          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
            mode === "specific"
              ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-light)]"
          }`}
        >
          <span className="font-medium">Páginas específicas</span>
          <span className="text-xs block mt-0.5 opacity-70">
            Seleccionar una por una
          </span>
        </button>
      </div>

      {mode === "range" && (
        <input
          type="text"
          value={rangeText}
          onChange={(e) => setRangeText(e.target.value)}
          placeholder="Ej: 1-5, 8, 12-15"
          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-dark)] focus:outline-none focus:border-[var(--accent)]/40"
        />
      )}

      {mode === "specific" && (
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => togglePage(page)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPages.has(page)
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card)] text-[var(--muted-dark)] border border-[var(--border)] hover:border-[var(--border-light)]"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-[var(--border)] rounded-xl text-[var(--muted)] text-sm font-medium hover:bg-[var(--card-hover)] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl text-white text-sm font-bold transition-colors flex items-center justify-center gap-1"
        >
          Procesar
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
