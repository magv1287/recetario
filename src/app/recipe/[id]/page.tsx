"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { compressImage } from "@/lib/image-utils";
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
        try {
          imageUrl = await compressImage(editImageFile);
        } catch (err) {
          console.error("Error compressing image:", err);
        }
      }

      const updates = {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        diets: editDiets,
        ingredients: editIngredients.split("\n").filter((s) => s.trim()),
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
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-5">
        <ChefHat className="text-zinc-700" size={56} />
        <p className="text-zinc-400 text-lg">Receta no encontrada</p>
        <button
          onClick={() => router.push("/")}
          className="text-amber-500 text-base font-medium"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const currentImage = editing ? editImagePreview : recipe.imageUrl;

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] pb-16">
      {/* ---- Desktop: back button bar ---- */}
      <div className="hidden lg:block sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 text-zinc-400 hover:text-zinc-200 transition-colors text-base font-medium"
          >
            <ArrowLeft size={20} />
            Volver al recetario
          </button>
          {!editing && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-[#18181b] border border-zinc-800 rounded-2xl text-sm font-medium text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Edit3 size={16} />
                Editar
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Mobile: hero image with overlay buttons ---- */}
      <div className="lg:hidden relative w-full aspect-[16/10] max-h-[45vh] bg-zinc-900">
        {currentImage ? (
          <img
            src={currentImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <ChefHat className="text-zinc-700" size={72} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/30" />
        <button
          onClick={() => router.push("/")}
          className="absolute top-5 left-5 bg-black/50 backdrop-blur-sm p-3 rounded-2xl z-10"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="absolute top-5 right-5 flex gap-3 z-10">
          {editing && (
            <label className="bg-black/50 backdrop-blur-sm p-3 rounded-2xl cursor-pointer">
              <ImageIcon size={22} className="text-amber-500" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className="bg-black/50 backdrop-blur-sm p-3 rounded-2xl">
                <Edit3 size={22} className="text-amber-500" />
              </button>
              <button onClick={() => setShowDelete(true)} className="bg-black/50 backdrop-blur-sm p-3 rounded-2xl">
                <Trash2 size={22} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-6xl mx-auto px-5 lg:px-8 -mt-8 lg:mt-0 relative z-10">
        {editing ? (
          /* ========== EDIT MODE ========== */
          <div className="max-w-2xl mx-auto lg:pt-8 space-y-6 animate-fadeIn">
            {/* Desktop: image editor */}
            <div className="hidden lg:block">
              <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                {editImagePreview ? (
                  <img src={editImagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <ChefHat className="text-zinc-700" size={72} />
                  </div>
                )}
                <label className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 text-sm font-medium text-zinc-200 hover:bg-black/80 transition-colors">
                  <ImageIcon size={16} className="text-amber-500" />
                  Cambiar imagen
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl lg:text-3xl font-bold bg-transparent border-b-2 border-zinc-800 pb-3 focus:outline-none focus:border-amber-500 text-zinc-100"
              placeholder="Titulo"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 px-5 text-base text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Descripcion..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">Categoria</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-3.5 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">Dietas</label>
                <div className="flex flex-wrap gap-2.5">
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
                      className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${
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
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">Ingredientes (uno por linea)</label>
              <textarea
                value={editIngredients}
                onChange={(e) => setEditIngredients(e.target.value)}
                rows={8}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 px-5 text-base text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">Pasos (uno por linea)</label>
              <textarea
                value={editSteps}
                onChange={(e) => setEditSteps(e.target.value)}
                rows={8}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 px-5 text-base text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => { setEditing(false); initEditForm(recipe); }}
                className="flex-1 py-4 border border-zinc-800 rounded-2xl text-zinc-400 text-base font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800/50 transition-colors"
              >
                <X size={18} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 bg-amber-500 rounded-2xl text-black text-base font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/10"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          /* ========== VIEW MODE ========== */
          <div className="lg:flex lg:gap-12 lg:pt-8 animate-fadeIn">

            {/* Desktop: left column - image */}
            <div className="hidden lg:block lg:w-2/5 shrink-0">
              <div className="sticky top-24">
                <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <ChefHat className="text-zinc-700" size={72} />
                    </div>
                  )}
                </div>

                {/* Source URL */}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-amber-500 text-base hover:text-amber-400 mt-5 font-medium"
                  >
                    <ExternalLink size={16} />
                    Ver receta original
                  </a>
                )}
              </div>
            </div>

            {/* Right column (or full width on mobile) - content */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Title and meta */}
              <div>
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <span className="bg-amber-500/10 text-amber-500 px-3.5 py-1.5 rounded-full text-sm font-semibold">
                    {getCategoryEmoji(recipe.category)} {recipe.category}
                  </span>
                  {recipe.diets && recipe.diets.length > 0 &&
                    recipe.diets.map((diet) => (
                      <span
                        key={diet}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getDietStyle(diet)}`}
                      >
                        {diet}
                      </span>
                    ))
                  }
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-zinc-100 leading-tight">
                  {recipe.title}
                </h1>
                {recipe.description && (
                  <p className="text-zinc-400 text-base lg:text-lg mt-3 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>

              {/* Mobile: source URL */}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lg:hidden inline-flex items-center gap-2 text-amber-500 text-base hover:text-amber-400 font-medium"
                >
                  <ExternalLink size={16} />
                  Ver receta original
                </a>
              )}

              {/* Ingredients & Steps - side by side on large desktop */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Ingredients */}
                <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-5">
                    Ingredientes ({recipe.ingredients?.length || 0})
                  </h2>
                  <ul className="space-y-3">
                    {recipe.ingredients?.map((ing, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-300 text-base leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-5">
                    Preparacion
                  </h2>
                  <ol className="space-y-5">
                    {recipe.steps?.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-zinc-300 text-base leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
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
