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
        onConfirm(null); // null = all pages
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
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-[#18181b] rounded-xl border border-zinc-800">
        <FileText className="text-amber-500 shrink-0" size={20} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {fileName}
          </p>
          <p className="text-xs text-zinc-500">{totalPages} páginas</p>
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        Este PDF tiene {totalPages} páginas. ¿Cuáles quieres procesar?
      </p>

      {/* Mode selector */}
      <div className="space-y-2">
        <button
          onClick={() => setMode("all")}
          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
            mode === "all"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <span className="font-medium">Páginas específicas</span>
          <span className="text-xs block mt-0.5 opacity-70">
            Seleccionar una por una
          </span>
        </button>
      </div>

      {/* Range input */}
      {mode === "range" && (
        <input
          type="text"
          value={rangeText}
          onChange={(e) => setRangeText(e.target.value)}
          placeholder="Ej: 1-5, 8, 12-15"
          className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
        />
      )}

      {/* Page grid */}
      {mode === "specific" && (
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => togglePage(page)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPages.has(page)
                  ? "bg-amber-500 text-black"
                  : "bg-[#18181b] text-zinc-500 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-zinc-800 rounded-xl text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-black text-sm font-bold transition-colors flex items-center justify-center gap-1"
        >
          Procesar
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
