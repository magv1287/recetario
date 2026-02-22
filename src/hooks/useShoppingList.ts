"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShoppingList } from "@/lib/types";

export function useShoppingList(userId: string | undefined, weekId: string) {
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !weekId) {
      setShoppingList(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, "shoppingLists", weekId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setShoppingList({ id: snap.id, ...snap.data() } as ShoppingList);
        } else {
          setShoppingList(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching shopping list:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, weekId]);

  const toggleItem = useCallback(
    async (itemIndex: number) => {
      if (!shoppingList) return;

      const updatedItems = shoppingList.items.map((item, i) =>
        i === itemIndex ? { ...item, checked: !item.checked } : item
      );

      const docRef = doc(db, "shoppingLists", shoppingList.id);
      await updateDoc(docRef, { items: updatedItems });
    },
    [shoppingList]
  );

  return { shoppingList, loading, toggleItem };
}
