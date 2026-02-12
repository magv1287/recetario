"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuthContext } from "@/components/AuthProvider";
import { Recipe, Category, Diet } from "@/lib/types";
import { getCategoryEmoji, getDietStyle, CATEGORIES, DIETS } from "@/lib/categories";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  ChefHat,
} from "lucide-react";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuthContext();
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("Otros");
  const [editDiets, setEditDiets] = useState<Diet[]>([]);
  const [editIngredients, setEditIngredients] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, "recipes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Recipe;
          setRecipe(data);
          initEditForm(data);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const initEditForm = (r: Recipe) => {
    setEditTitle(r.title);
    setEditDescription(r.description || "");
    setEditCategory(r.category);
    setEditDiets(r.diets || []);
    setEditIngredients(r.ingredients?.join("\n") || "");
    setEditSteps(r.steps?.join("\n") || "");
    setEditImagePreview(r.imageUrl || null);
  };

  const handleSave = async () => {
    if (!recipe || !user) return;
    setSaving(true);

    try {
      let imageUrl = recipe.imageUrl;

      if (editImageFile) {
        const fileName = `recipes/${user.uid}/${Date.now()}_${editImageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, editImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const updates = {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        diets: editDiets,
        ingredients: editIngredients
          .split("\n")
          .filter((s) => s.trim()),
        steps: editSteps.split("\n").filter((s) => s.trim()),
        imageUrl,
      };

      await updateDoc(doc(db, "recipes", id), updates);
      setRecipe({ ...recipe, ...updates });
      setEditing(false);
    } catch (error) {
      console.error("Error updating recipe:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe || !user) return;
    try {
      await deleteDoc(doc(db, "recipes", id));
      router.push("/");
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Receta no encontrada</p>
        <button
          onClick={() => router.push("/")}
          className="text-amber-500 text-sm"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] pb-12">
      {/* Hero image */}
      <div className="relative w-full aspect-[16/10] max-h-[50vh] bg-zinc-900">
        {(editing ? editImagePreview : recipe.imageUrl) ? (
          <img
            src={(editing ? editImagePreview : recipe.imageUrl) || ""}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <ChefHat className="text-zinc-700" size={64} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/30" />

        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm p-2 rounded-full z-10"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {editing && (
            <label className="bg-black/50 backdrop-blur-sm p-2 rounded-full cursor-pointer">
              <ImageIcon size={20} className="text-amber-500" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-black/50 backdrop-blur-sm p-2 rounded-full"
              >
                <Edit3 size={20} className="text-amber-500" />
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="bg-black/50 backdrop-blur-sm p-2 rounded-full"
              >
                <Trash2 size={20} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10">
        {editing ? (
          /* ----- EDIT MODE ----- */
          <div className="space-y-5 animate-fadeIn">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b border-zinc-800 pb-2 focus:outline-none focus:border-amber-500 text-zinc-100"
              placeholder="Título"
            />

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Descripción..."
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Categoría
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Dietas
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((diet) => (
                  <button
                    key={diet.name}
                    type="button"
                    onClick={() => {
                      setEditDiets(
                        editDiets.includes(diet.name)
                          ? editDiets.filter((d) => d !== diet.name)
                          : [...editDiets, diet.name]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      editDiets.includes(diet.name)
                        ? diet.color
                        : "border-zinc-800 text-zinc-600"
                    }`}
                  >
                    {diet.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Ingredientes (uno por línea)
              </label>
              <textarea
                value={editIngredients}
                onChange={(e) => setEditIngredients(e.target.value)}
                rows={6}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Pasos (uno por línea)
              </label>
              <textarea
                value={editSteps}
                onChange={(e) => setEditSteps(e.target.value)}
                rows={6}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(false);
                  initEditForm(recipe);
                }}
                className="flex-1 py-3 border border-zinc-800 rounded-xl text-zinc-400 text-sm font-medium flex items-center justify-center gap-2"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-amber-500 rounded-xl text-black text-sm font-bold flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          /* ----- VIEW MODE ----- */
          <div className="space-y-6 animate-fadeIn">
            {/* Title and meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-xs font-medium">
                  {getCategoryEmoji(recipe.category)} {recipe.category}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-zinc-400 text-sm mt-2">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* Diet tags */}
            {recipe.diets && recipe.diets.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {recipe.diets.map((diet) => (
                  <span
                    key={diet}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getDietStyle(diet)}`}
                  >
                    {diet}
                  </span>
                ))}
              </div>
            )}

            {/* Source URL */}
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400"
              >
                <ExternalLink size={14} />
                Ver receta original
              </a>
            )}

            {/* Ingredients */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-3">
                Ingredientes ({recipe.ingredients?.length || 0})
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-zinc-300 text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-3">
                Preparación
              </h2>
              <ol className="space-y-4">
                {recipe.steps?.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <DeleteConfirm
          title={recipe.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </main>
  );
}
