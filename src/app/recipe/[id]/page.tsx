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
import { useFavorites } from "@/hooks/useFavorites";
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
  Heart,
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
  const { toggleFavorite, isFavorite } = useFavorites(user?.uid);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

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
      router.push("/recipes");
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
      <div className="h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <ChefHat className="text-[var(--border-light)]" size={48} />
        <p className="text-[var(--muted)] text-base">Receta no encontrada</p>
        <button
          onClick={() => router.push("/recipes")}
          className="text-[var(--accent)] text-sm font-medium"
        >
          Volver al recetario
        </button>
      </div>
    );
  }

  const currentImage = editing ? editImagePreview : recipe.imageUrl;
  const recipeIsFavorite = isFavorite(recipe.id);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 lg:pb-16">
      {/* Desktop: back button bar */}
      <div className="hidden lg:block border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/recipes")}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Volver al recetario
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                recipeIsFavorite
                  ? "bg-red-500/8 border-red-500/20 text-red-400"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-light)]"
              }`}
            >
              <Heart size={15} className={recipeIsFavorite ? "fill-red-400" : ""} />
              {recipeIsFavorite ? "Favorita" : "Favorito"}
            </button>
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--muted)] hover:border-[var(--border-light)] transition-colors"
                >
                  <Edit3 size={15} />
                  Editar
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/8 border border-red-500/15 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/15 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: hero image with overlay buttons */}
      <div className="lg:hidden relative w-full aspect-[16/10] max-h-[40vh] bg-[#0c0c0e]">
        {currentImage ? (
          <img
            src={currentImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-soft)] to-transparent">
            <ChefHat className="text-[var(--border-light)]" size={64} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)]/20" />
        <button
          onClick={() => router.push("/recipes")}
          className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl z-10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => toggleFavorite(recipe.id)}
            className="bg-black/40 backdrop-blur-sm p-2.5 rounded-xl active:scale-90 transition-transform"
          >
            <Heart
              size={20}
              className={recipeIsFavorite ? "text-red-500 fill-red-500" : "text-white/70"}
            />
          </button>
          {editing && (
            <label className="bg-black/40 backdrop-blur-sm p-2.5 rounded-xl cursor-pointer">
              <ImageIcon size={20} className="text-[var(--accent)]" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className="bg-black/40 backdrop-blur-sm p-2.5 rounded-xl">
                <Edit3 size={20} className="text-[var(--accent)]" />
              </button>
              <button onClick={() => setShowDelete(true)} className="bg-black/40 backdrop-blur-sm p-2.5 rounded-xl">
                <Trash2 size={20} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 lg:px-8 -mt-6 lg:mt-0 relative z-10">
        {editing ? (
          <div className="max-w-2xl mx-auto lg:pt-6 space-y-5 animate-fadeIn">
            <div className="hidden lg:block">
              <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden bg-[#0c0c0e] border border-[var(--border)]">
                {editImagePreview ? (
                  <img src={editImagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-soft)] to-transparent">
                    <ChefHat className="text-[var(--border-light)]" size={64} />
                  </div>
                )}
                <label className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-medium text-zinc-200 hover:bg-black/70 transition-colors">
                  <ImageIcon size={15} className="text-[var(--accent)]" />
                  Cambiar imagen
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl lg:text-2xl font-bold bg-transparent border-b-2 border-[var(--border)] pb-3 focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)]"
              placeholder="Titulo"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/40 resize-none"
              placeholder="Descripcion..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-1.5 block">Categoria</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-1.5 block">Dietas</label>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        editDiets.includes(diet.name)
                          ? diet.color
                          : "border-[var(--border)] text-[var(--muted-dark)]"
                      }`}
                    >
                      {diet.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-1.5 block">Ingredientes (uno por linea)</label>
              <textarea
                value={editIngredients}
                onChange={(e) => setEditIngredients(e.target.value)}
                rows={8}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/40 resize-none font-mono leading-relaxed"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-1.5 block">Pasos (uno por linea)</label>
              <textarea
                value={editSteps}
                onChange={(e) => setEditSteps(e.target.value)}
                rows={8}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/40 resize-none font-mono leading-relaxed"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setEditing(false); initEditForm(recipe); }}
                className="flex-1 py-3.5 border border-[var(--border)] rounded-xl text-[var(--muted)] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--card)] transition-colors"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3.5 bg-[var(--accent)] rounded-xl text-black text-sm font-bold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:flex lg:gap-10 lg:pt-6 animate-fadeIn">
            <div className="hidden lg:block lg:w-2/5 shrink-0">
              <div className="sticky top-24">
                <div className="rounded-xl overflow-hidden bg-[#0c0c0e] border border-[var(--border)]">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-[var(--accent-soft)] to-transparent">
                      <ChefHat className="text-[var(--border-light)]" size={64} />
                    </div>
                  )}
                </div>

                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[var(--accent)] text-sm hover:text-[var(--accent-hover)] mt-4 font-medium"
                  >
                    <ExternalLink size={14} />
                    Ver receta original
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  <span className="bg-[var(--accent-soft)] text-[var(--accent)] px-3 py-1 rounded-full text-xs font-semibold">
                    {getCategoryEmoji(recipe.category)} {recipe.category}
                  </span>
                  {recipe.diets && recipe.diets.length > 0 &&
                    recipe.diets.map((diet) => (
                      <span
                        key={diet}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDietStyle(diet)}`}
                      >
                        {diet}
                      </span>
                    ))
                  }
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] leading-tight">
                  {recipe.title}
                </h1>
                {recipe.description && (
                  <p className="text-[var(--muted)] text-sm lg:text-base mt-2.5 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>

              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lg:hidden inline-flex items-center gap-2 text-[var(--accent)] text-sm font-medium"
                >
                  <ExternalLink size={14} />
                  Ver receta original
                </a>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
                  <h2 className="text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-4">
                    Ingredientes ({recipe.ingredients?.length || 0})
                  </h2>
                  <ul className="space-y-2.5">
                    {recipe.ingredients?.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[var(--muted)] text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
                  <h2 className="text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-4">
                    Preparacion
                  </h2>
                  <ol className="space-y-4">
                    {recipe.steps?.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[var(--muted)] text-sm leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
