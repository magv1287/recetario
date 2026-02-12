"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Recipe, RecipeFormData } from "@/lib/types";

export function useRecipes(userId: string | undefined) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "recipes"),
      where("userId", "==", userId),
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

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addRecipe = async (data: RecipeFormData) => {
    if (!userId) throw new Error("Not authenticated");

    let imageUrl = data.imageUrl || "";

    if (data.imageFile) {
      const fileName = `recipes/${userId}/${Date.now()}_${data.imageFile.name}`;
      imageUrl = await uploadImage(data.imageFile, fileName);
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

    if (data.imageFile) {
      const fileName = `recipes/${userId}/${Date.now()}_${data.imageFile.name}`;
      updateData.imageUrl = await uploadImage(data.imageFile, fileName);
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
