"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-2xl p-6 animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-red-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Eliminar receta</h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              ¿Eliminar &ldquo;{title}&rdquo;? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 border border-zinc-800 rounded-xl text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-red-500 rounded-xl text-white text-sm font-bold hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
