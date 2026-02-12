"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        const docRef = doc(db, "userPrefs", userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setFavorites(new Set(data.favorites || []));
        } else {
          // Create the document for the first time
          await setDoc(docRef, { favorites: [] });
          setFavorites(new Set());
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [userId]);

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      if (!userId) return;

      const docRef = doc(db, "userPrefs", userId);
      const isFav = favorites.has(recipeId);

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.delete(recipeId);
        } else {
          next.add(recipeId);
        }
        return next;
      });

      try {
        if (isFav) {
          await updateDoc(docRef, { favorites: arrayRemove(recipeId) });
        } else {
          await updateDoc(docRef, { favorites: arrayUnion(recipeId) });
        }
      } catch (error) {
        // Revert on error
        console.error("Error toggling favorite:", error);
        setFavorites((prev) => {
          const next = new Set(prev);
          if (isFav) {
            next.add(recipeId);
          } else {
            next.delete(recipeId);
          }
          return next;
        });
      }
    },
    [userId, favorites]
  );

  const isFavorite = useCallback(
    (recipeId: string) => favorites.has(recipeId),
    [favorites]
  );

  return { favorites, loading, toggleFavorite, isFavorite };
}
