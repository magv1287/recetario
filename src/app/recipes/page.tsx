"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useRecipes } from "@/hooks/useRecipes";
import { useFavorites } from "@/hooks/useFavorites";
import { SearchBar } from "@/components/SearchBar";
import { RecipeCard } from "@/components/RecipeCard";
import { ImportModal } from "@/components/ImportModal";
import { Category, Diet, RecipeSource, ExtractedRecipe } from "@/lib/types";
import { CATEGORIES, DIETS } from "@/lib/categories";
import { getCategoryEmoji } from "@/lib/categories";
import {
  Plus,
  BookOpen,
  Search,
  Heart,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

type SourceFilter = "all" | RecipeSource;

export default function RecipesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { recipes, loading: recipesLoading, addRecipe } = useRecipes(user?.uid);
  const { toggleFavorite, isFavorite } = useFavorites(user?.uid);

  const [activeCategory, setActiveCategory] = useState<"Todas" | Category>("Todas");
  const [activeDiets, setActiveDiets] = useState<Diet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => isFavorite(r.id));
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((r) => (r.source || "manual") === sourceFilter);
    }

    if (activeCategory !== "Todas") {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    if (activeDiets.length > 0) {
      filtered = filtered.filter((r) =>
        activeDiets.some((d) => r.diets?.includes(d))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.ingredients?.some((i) => i.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [recipes, activeCategory, activeDiets, searchQuery, showFavoritesOnly, isFavorite, sourceFilter]);

  const handleSaveRecipes = async (
    extractedRecipes: ExtractedRecipe[],
    imageFiles?: (File | null)[]
  ) => {
    for (let i = 0; i < extractedRecipes.length; i++) {
      const recipe = extractedRecipes[i];
      const imageFile = imageFiles?.[i] || null;

      await addRecipe({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        diets: recipe.diets,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        imageUrl: recipe.imageUrl || "",
        imageFile: imageFile || undefined,
        sourceUrl: "",
      });
    }
  };

  const clearFilters = () => {
    setActiveCategory("Todas");
    setActiveDiets([]);
    setSearchQuery("");
    setShowFavoritesOnly(false);
    setSourceFilter("all");
  };

  const hasFilters = activeCategory !== "Todas" || activeDiets.length > 0 || searchQuery || showFavoritesOnly || sourceFilter !== "all";

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 pb-6 lg:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-[var(--accent)] hidden sm:block" />
            <h1 className="text-xl font-bold text-[var(--foreground)]">Recetario</h1>
            <span className="text-xs text-[var(--muted-dark)] font-medium bg-[var(--card)] px-2 py-0.5 rounded-full">
              {recipes.length}
            </span>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="hidden lg:flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Importar receta
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          {/* Source + Favorites row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                showFavoritesOnly
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] active:scale-95"
              }`}
            >
              <Heart size={12} className={showFavoritesOnly ? "fill-red-400" : ""} />
              Favoritos
            </button>

            <div className="flex items-center shrink-0">
              <span className="w-px h-4 bg-[var(--border)]" />
            </div>

            {([
              { value: "all" as SourceFilter, label: "Todas", icon: null },
              { value: "ai" as SourceFilter, label: "IA", icon: <Sparkles size={11} /> },
              { value: "imported" as SourceFilter, label: "Importadas", icon: <Upload size={11} /> },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSourceFilter(opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  sourceFilter === opt.value
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] active:scale-95"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[{ name: "Todas" as "Todas" | Category, emoji: "📖" }, ...CATEGORIES].map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.name
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] active:scale-95"
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Diet pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {DIETS.map((diet) => {
              const isActive = activeDiets.includes(diet.name);
              return (
                <button
                  key={diet.name}
                  onClick={() => {
                    if (isActive) {
                      setActiveDiets(activeDiets.filter((d) => d !== diet.name));
                    } else {
                      setActiveDiets([...activeDiets, diet.name]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? diet.color
                      : "bg-transparent border-[var(--border)] text-[var(--muted-dark)] active:scale-95"
                  }`}
                >
                  {diet.name}
                </button>
              );
            })}
          </div>

          {/* Count + clear */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-dark)] font-medium">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? "receta" : "recetas"}
              {activeCategory !== "Todas" && (
                <span className="ml-1">en {getCategoryEmoji(activeCategory)} {activeCategory}</span>
              )}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[var(--accent)] font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Recipe grid */}
        {recipesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
            {recipes.length === 0 ? (
              <>
                <BookOpen className="text-[var(--border-light)] mx-auto mb-4" size={48} />
                <p className="text-[var(--muted)] text-base mb-2 font-medium">
                  No hay recetas aun
                </p>
                <p className="text-[var(--muted-dark)] text-sm mb-6 max-w-xs mx-auto">
                  Las recetas generadas por el planificador apareceran aqui automaticamente
                </p>
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  <Plus size={16} />
                  Importar receta
                </button>
              </>
            ) : showFavoritesOnly ? (
              <>
                <Heart className="text-[var(--border-light)] mx-auto mb-4" size={48} />
                <p className="text-[var(--muted)] text-base font-medium">
                  No tienes recetas favoritas
                </p>
              </>
            ) : (
              <>
                <Search className="text-[var(--border-light)] mx-auto mb-4" size={48} />
                <p className="text-[var(--muted)] text-base font-medium">
                  No se encontraron recetas
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                isFavorite={isFavorite(recipe.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowImport(true)}
        className="fixed right-5 bottom-24 z-40 bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-95 text-white p-3.5 rounded-xl shadow-lg transition-all lg:hidden"
        aria-label="Importar receta"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSave={handleSaveRecipes}
        />
      )}
    </main>
  );
}
