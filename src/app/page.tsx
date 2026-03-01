"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useWeeklyPlan, getWeekId, getNextWeekId, getWeekDates } from "@/hooks/useWeeklyPlan";
import { usePrepGuide } from "@/hooks/usePrepGuide";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WeekSelector } from "@/components/WeekSelector";
import { PortionSelector } from "@/components/PortionSelector";
import { PrepGuideModal } from "@/components/PrepGuideModal";
import { DayOfWeek, MealType, CronStatus } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isAdmin } from "@/lib/access-control";
import { Loader2, Sparkles, ChefHat, Copy, RefreshCw, UtensilsCrossed } from "lucide-react";

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  const [weekId, setWeekId] = useState(() => getWeekId());
  const [portions, setPortions] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [cronRan, setCronRan] = useState(false);
  const [prevWeekHasPlan, setPrevWeekHasPlan] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const { plan, recipes, loading: planLoading, toggleLock, clearMeal, copyPlanToWeek } = useWeeklyPlan(user?.uid, weekId);
  const { prepGuide, toggleStep } = usePrepGuide(user?.uid, weekId);

  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [showPrepGuide, setShowPrepGuide] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user?.email) {
      isAdmin(user.email).then(setUserIsAdmin);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    checkCronStatus();
    checkPrevWeekPlan();
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

  const checkPrevWeekPlan = async () => {
    try {
      const prevId = getPrevWeekId(weekId);
      const snap = await getDoc(doc(db, "weeklyPlans", prevId));
      setPrevWeekHasPlan(snap.exists());
    } catch {
      setPrevWeekHasPlan(false);
    }
  };

  const navigateWeek = (direction: -1 | 1) => {
    const { start } = getWeekDatesFromId(weekId);
    start.setDate(start.getDate() + direction * 7);
    setWeekId(getWeekId(start));
  };

  const handleGenerate = async (regenerate = false) => {
    if (!user || generating) return;
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

  const handleCopyToNextWeek = async () => {
    if (!plan || copying) return;
    setCopying(true);
    setError("");
    try {
      const nextId = getNextWeekId(new Date(getWeekDates(weekId).start));
      await copyPlanToWeek(nextId);
      setWeekId(nextId);
    } catch (err: any) {
      setError(err.message || "Error al copiar el plan");
    } finally {
      setCopying(false);
    }
  };

  const handleCopyFromPrevWeek = async () => {
    if (copying) return;
    setCopying(true);
    setError("");
    try {
      const prevId = getPrevWeekId(weekId);
      const snap = await getDoc(doc(db, "weeklyPlans", prevId));
      if (!snap.exists()) throw new Error("No hay plan en la semana anterior");

      const prevPlan = snap.data();
      await import("firebase/firestore").then(async ({ setDoc, doc: docRef }) => {
        await setDoc(doc(db, "weeklyPlans", weekId), {
          userId: user!.uid,
          portions: prevPlan.portions || portions,
          status: "draft",
          generatedAt: new Date(),
          meals: prevPlan.meals,
        });
      });
    } catch (err: any) {
      setError(err.message || "Error al copiar el plan");
    } finally {
      setCopying(false);
    }
  };

  const handleGeneratePrepGuide = async () => {
    if (generatingPrep) return;
    setGeneratingPrep(true);
    setError("");
    try {
      const res = await fetch("/api/generate-prep-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar la guia");
      }
      setShowPrepGuide(true);
    } catch (err: any) {
      setError(err.message || "Error al generar la guia de prep");
    } finally {
      setGeneratingPrep(false);
    }
  };

  const handleToggleLock = useCallback(
    (day: DayOfWeek, meal: MealType) => { toggleLock(day, meal); },
    [toggleLock]
  );

  const handleClearMeal = useCallback(
    (day: DayOfWeek, meal: MealType) => { clearMeal(day, meal); },
    [clearMeal]
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

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-8">
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

          {/* Row 2: Portions + action buttons (only when plan exists) */}
          <div className="flex items-center justify-between">
            <PortionSelector value={portions} onChange={setPortions} />

            {hasPlan && (
              <div className="flex items-center gap-2">
                <button
                  onClick={prepGuide ? () => setShowPrepGuide(true) : handleGeneratePrepGuide}
                  disabled={generatingPrep}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--accent-soft)] border border-[var(--accent)]/20 rounded-xl text-[13px] font-medium text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-colors disabled:opacity-50"
                >
                  {generatingPrep ? <Loader2 className="animate-spin" size={14} /> : <UtensilsCrossed size={14} />}
                  Prep Domingo
                </button>
                {isCurrentOrFuture && userIsAdmin && (
                  <>
                    <button
                      onClick={() => handleGenerate(true)}
                      disabled={generating}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-[var(--border)] rounded-xl text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                      Regenerar
                    </button>
                    <button
                      onClick={handleCopyToNextWeek}
                      disabled={copying}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-[var(--border)] rounded-xl text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)] transition-colors disabled:opacity-50"
                    >
                      {copying ? <Loader2 className="animate-spin" size={14} /> : <Copy size={14} />}
                      Copiar a siguiente
                    </button>
                  </>
                )}
              </div>
            )}
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
          <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <ChefHat className="text-[var(--border-light)] mx-auto mb-4" size={48} />
            <p className="text-[var(--muted)] text-base mb-2 font-medium">No hay plan para esta semana</p>
            <p className="text-[var(--muted-dark)] text-sm mb-6 max-w-xs mx-auto">
              Genera un nuevo plan o copia el de la semana anterior
            </p>
            {isCurrentOrFuture && userIsAdmin && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={generating || copying}
                  className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <><Loader2 className="animate-spin" size={16} />Generando...</>
                  ) : (
                    <><Sparkles size={16} />Generar Plan</>
                  )}
                </button>
                {prevWeekHasPlan && (
                  <button
                    onClick={handleCopyFromPrevWeek}
                    disabled={generating || copying}
                    className="inline-flex items-center gap-2 border border-[var(--border)] hover:border-[var(--border-light)] text-[var(--muted)] hover:text-[var(--foreground)] font-medium px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {copying ? (
                      <><Loader2 className="animate-spin" size={16} />Copiando...</>
                    ) : (
                      <><Copy size={16} />Copiar semana anterior</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <WeeklyCalendar
            plan={plan}
            recipes={recipes}
            weekId={weekId}
            onToggleLock={handleToggleLock}
            onClearMeal={handleClearMeal}
            onPlanUpdated={handlePlanUpdated}
          />
        )}
      </div>

      {showPrepGuide && prepGuide && (
        <PrepGuideModal guide={prepGuide} onToggle={toggleStep} onClose={() => setShowPrepGuide(false)} />
      )}
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

function getPrevWeekId(weekId: string): string {
  const { start } = getWeekDatesFromId(weekId);
  start.setDate(start.getDate() - 7);
  return getWeekId(start);
}
