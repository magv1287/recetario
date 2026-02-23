"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useWeeklyPlan, getWeekId } from "@/hooks/useWeeklyPlan";
import { ShoppingListView } from "@/components/ShoppingListView";
import { WeekSelector } from "@/components/WeekSelector";
import { Loader2, ShoppingCart, ListPlus, RefreshCw, Send } from "lucide-react";

export default function ShoppingListPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  const [weekId, setWeekId] = useState(() => getWeekId());
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const { shoppingList, loading: listLoading, toggleItem } = useShoppingList(user?.uid, weekId);
  const { plan } = useWeeklyPlan(user?.uid, weekId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const navigateWeek = (direction: -1 | 1) => {
    const [yearStr, weekStr] = weekId.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const start = new Date(jan4);
    start.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
    start.setDate(start.getDate() + direction * 7);
    setWeekId(getWeekId(start));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar la lista");
      }
    } catch (err: any) {
      setError(err.message || "Error al generar la lista de compras");
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncBring = async () => {
    setSyncing(true);
    setError("");
    setSyncMessage("");

    try {
      const res = await fetch("/api/bring/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar con Bring!");
      }

      setSyncMessage("Lista sincronizada con Bring!");
      setTimeout(() => setSyncMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error al sincronizar con Bring!");
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
      </div>
    );
  }

  const hasPlan = !!plan;
  const hasList = !!shoppingList;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-2xl mx-auto px-5 lg:px-8 py-6 pb-28 lg:pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart size={22} className="text-[var(--accent)] hidden sm:block" />
            <h1 className="text-xl font-bold text-[var(--foreground)]">Lista de Compras</h1>
          </div>
          <WeekSelector
            weekId={weekId}
            onPrev={() => navigateWeek(-1)}
            onNext={() => navigateWeek(1)}
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-6">
          {hasPlan && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] rounded-lg text-sm font-bold text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="animate-spin" size={15} />
              ) : hasList ? (
                <RefreshCw size={15} />
              ) : (
                <ListPlus size={15} />
              )}
              {generating ? "Generando..." : hasList ? "Regenerar lista" : "Generar lista"}
            </button>
          )}

          {hasList && (
            <button
              onClick={handleSyncBring}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--sage-soft)] border border-[var(--sage)]/20 rounded-lg text-sm font-semibold text-[var(--sage)] hover:bg-[var(--sage)]/15 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              {syncing ? "Sincronizando..." : "Enviar a Bring!"}
            </button>
          )}

          {shoppingList?.syncedToBring && !syncMessage && (
            <span className="text-xs text-[var(--sage)] font-medium ml-2">Sincronizado</span>
          )}

          {syncMessage && (
            <span className="text-xs text-[var(--sage)] font-medium ml-2 animate-fadeIn">{syncMessage}</span>
          )}
        </div>

        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 mb-6 animate-fadeIn">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {listLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
          </div>
        ) : !hasList ? (
          <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <ShoppingCart className="text-[var(--border-light)] mx-auto mb-4" size={48} />
            <p className="text-[var(--muted)] text-base mb-2 font-medium">
              No hay lista de compras
            </p>
            <p className="text-[var(--muted-dark)] text-sm max-w-xs mx-auto">
              {hasPlan
                ? "Genera la lista de compras a partir del plan semanal"
                : "Primero genera un plan semanal en el Calendario"}
            </p>
          </div>
        ) : (
          <ShoppingListView
            shoppingList={shoppingList}
            onToggleItem={toggleItem}
          />
        )}
      </div>
    </main>
  );
}
