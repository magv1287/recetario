"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PrepGuide } from "@/lib/types";

export function usePrepGuide(userId: string | undefined, weekId: string) {
  const [prepGuide, setPrepGuide] = useState<PrepGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !weekId) {
      setPrepGuide(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, "prepGuides", weekId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setPrepGuide({ id: snap.id, ...snap.data() } as PrepGuide);
        } else {
          setPrepGuide(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching prep guide:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, weekId]);

  const toggleStep = useCallback(
    async (phaseIndex: number, instructionIndex: number) => {
      if (!prepGuide) return;

      const updatedSteps = prepGuide.steps.map((step, i) => {
        if (i !== phaseIndex) return step;
        const checked = [...(step.checked || new Array(step.instructions.length).fill(false))];
        checked[instructionIndex] = !checked[instructionIndex];
        return { ...step, checked };
      });

      const docRef = doc(db, "prepGuides", prepGuide.id);
      await updateDoc(docRef, { steps: updatedSteps });
    },
    [prepGuide]
  );

  return { prepGuide, loading, toggleStep };
}
