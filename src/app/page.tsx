"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useWeeklyPlan, getWeekId, getNextWeekId } from "@/hooks/useWeeklyPlan";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WeekSelector } from "@/components/WeekSelector";
import { PortionSelector } from "@/components/PortionSelector";
import { DayOfWeek, MealType, CronStatus } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Sparkles, ChefHat } from "lucide-react";

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  const [weekId, setWeekId] = useState(() => getWeekId());
  const [portions, setPortions] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [cronRan, setCronRan] = useState(false);

  const { plan, recipes, loading: planLoading, toggleLock } = useWeeklyPlan(user?.uid, weekId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    checkCronStatus();
  }, [weekId]);

  const checkCronStatus = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "cronStatus"));
      if (snap.exists()) {
        const data = snap.data() as CronStatus;
        setCronRan(data.weekId === weekId && data.success);
      } else {
        setCronRan(false);
      }
    } catch {
      setCronRan(false);
    }
  };

  const navigateWeek = (direction: -1 | 1) => {
    const { start } = getWeekDatesFromId(weekId);
    start.setDate(start.getDate() + direction * 7);
    setWeekId(getWeekId(start));
  };

  const handleGenerate = async (regenerate = false) => {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, portions, regenerate, userId: user.uid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar el plan");
      }
    } catch (err: any) {
      setError(err.message || "Error al generar el plan semanal");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLock = useCallback(
    (day: DayOfWeek, meal: MealType) => { toggleLock(day, meal); },
    [toggleLock]
  );

  const handlePlanUpdated = useCallback(() => {}, []);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
      </div>
    );
  }

  const isCurrentOrFuture = weekId >= getWeekId();
  const hasPlan = !!plan;
  const canGenerate = isCurrentOrFuture && !generating;
  const buttonDisabled = cronRan && hasPlan && !generating;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-8">
        {/* Top bar: week nav + portions + actions */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1: Title + Week selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">Planificador Semanal</h1>
            <WeekSelector
              weekId={weekId}
              onPrev={() => navigateWeek(-1)}
              onNext={() => navigateWeek(1)}
            />
          </div>

          {/* Row 2: Portions + Generate buttons */}
          <div className="flex items-center justify-between">
            <PortionSelector value={portions} onChange={setPortions} />

            <div className="flex items-center gap-2">
              {hasPlan && isCurrentOrFuture && (
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={generating}
                  className="px-3.5 py-2 border border-[var(--border)] rounded-xl text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors disabled:opacity-50"
                >
                  Regenerar
                </button>
              )}
              <button
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate || (buttonDisabled && !generating)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] rounded-xl text-[13px] font-bold text-black hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40"
              >
                {generating ? (
                  <><Loader2 className="animate-spin" size={15} />Generando...</>
                ) : cronRan && hasPlan ? (
                  <><Sparkles size={15} />Ya generado</>
                ) : (
                  <><Sparkles size={15} />Generar Plan</>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 mb-5 animate-fadeIn">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {planLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
          </div>
        ) : !hasPlan ? (
          <div className="text-center py-24 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <ChefHat className="text-[var(--border-light)] mx-auto mb-4" size={48} />
            <p className="text-[var(--muted)] text-base mb-2 font-medium">No hay plan para esta semana</p>
            <p className="text-[var(--muted-dark)] text-sm mb-6 max-w-xs mx-auto">
              Genera tu plan semanal con recetas anti-inflamatorias, altas en proteina y bajas en carbohidratos
            </p>
            {isCurrentOrFuture && (
              <button
                onClick={() => handleGenerate(false)}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="animate-spin" size={16} />Generando plan...</>
                ) : (
                  <><Sparkles size={16} />Generar Plan Semanal</>
                )}
              </button>
            )}
          </div>
        ) : (
          <WeeklyCalendar
            plan={plan}
            recipes={recipes}
            weekId={weekId}
            onToggleLock={handleToggleLock}
            onPlanUpdated={handlePlanUpdated}
          />
        )}
      </div>
    </main>
  );
}

function getWeekDatesFromId(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}
