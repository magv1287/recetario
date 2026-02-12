"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe, RecipeFormData } from "@/lib/types";
import { compressImage } from "@/lib/image-utils";

export function useRecipes(userId: string | undefined) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Fetch ALL recipes (shared between all authorized users)
    const q = query(
      collection(db, "recipes"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: Recipe[] = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as Recipe);
        });
        setRecipes(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recipes:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addRecipe = async (data: RecipeFormData) => {
    if (!userId) throw new Error("Not authenticated");

    let imageUrl = data.imageUrl || "";

    // Compress and convert image to base64 if a file is provided
    if (data.imageFile) {
      try {
        imageUrl = await compressImage(data.imageFile);
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }

    const recipeData = {
      title: data.title,
      description: data.description,
      category: data.category,
      diets: data.diets,
      ingredients: data.ingredients,
      steps: data.steps,
      imageUrl,
      sourceUrl: data.sourceUrl || "",
      userId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "recipes"), recipeData);
    return docRef.id;
  };

  const updateRecipe = async (
    recipeId: string,
    data: Partial<RecipeFormData>
  ) => {
    if (!userId) throw new Error("Not authenticated");

    const updateData: any = { ...data };

    // Compress and convert image to base64 if a new file is provided
    if (data.imageFile) {
      try {
        updateData.imageUrl = await compressImage(data.imageFile);
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }

    delete updateData.imageFile;
    await updateDoc(doc(db, "recipes", recipeId), updateData);
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!userId) throw new Error("Not authenticated");
    await deleteDoc(doc(db, "recipes", recipeId));
  };

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
