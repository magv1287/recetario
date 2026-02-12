"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useRecipes } from "@/hooks/useRecipes";
import { useFavorites } from "@/hooks/useFavorites";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DietFilter } from "@/components/DietFilter";
import { SearchBar } from "@/components/SearchBar";
import { RecipeCard } from "@/components/RecipeCard";
import { ImportModal } from "@/components/ImportModal";
import { AccessManager } from "@/components/AccessManager";
import { isAdmin } from "@/lib/access-control";
import { Category, Diet, ExtractedRecipe } from "@/lib/types";
import { CATEGORIES, DIETS } from "@/lib/categories";
import { getCategoryEmoji } from "@/lib/categories";
import {
  Plus,
  ChefHat,
  Search,
  Heart,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuthContext();
  const router = useRouter();
  const { recipes, loading: recipesLoading, addRecipe } = useRecipes(user?.uid);
  const { toggleFavorite, isFavorite } = useFavorites(user?.uid);

  const [activeCategory, setActiveCategory] = useState<"Todas" | Category>("Todas");
  const [activeDiets, setActiveDiets] = useState<Diet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAccessManager, setShowAccessManager] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.email) {
      isAdmin(user.email).then(setUserIsAdmin);
    }
  }, [user?.email]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => isFavorite(r.id));
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
  }, [recipes, activeCategory, activeDiets, searchQuery, showFavoritesOnly, isFavorite]);

  // Save recipes from import modal
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
  };

  const hasFilters = activeCategory !== "Todas" || activeDiets.length > 0 || searchQuery || showFavoritesOnly;

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50 safe-top">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChefHat className="text-amber-500" size={28} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Recetario
            </h1>
          </div>

          {/* Desktop: search in header */}
          <div className="hidden lg:flex items-center gap-6 flex-1 max-w-2xl mx-10">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop: Add recipe button */}
            <button
              onClick={() => setShowImport(true)}
              className="hidden lg:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-amber-500/10"
            >
              <Plus size={18} />
              Nueva receta
            </button>

            {/* Desktop: Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`hidden lg:flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium border transition-all ${
                showFavoritesOnly
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <Heart size={16} className={showFavoritesOnly ? "fill-red-400" : ""} />
              Favoritos
            </button>

            {userIsAdmin && (
              <button
                onClick={() => setShowAccessManager(true)}
                className="text-zinc-500 hover:text-zinc-300 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors"
                title="Gestionar acceso"
              >
                <Users size={20} />
              </button>
            )}

            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-zinc-800 hidden sm:block"
              />
            )}
            <button
              onClick={signOut}
              className="text-zinc-500 hover:text-zinc-300 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors"
              title="Cerrar sesion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ DESKTOP LAYOUT: sidebar + content ============ */}
      <div className="max-w-7xl mx-auto lg:px-8 lg:flex lg:gap-10 lg:pt-8">

        {/* ---- Desktop Sidebar ---- */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* User info */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <ChefHat className="text-amber-500" size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-zinc-200 truncate">
                    {user?.displayName || "Chef"}
                  </p>
                  <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  {recipes.length} {recipes.length === 1 ? "receta" : "recetas"} guardadas
                </p>
                {userIsAdmin && (
                  <button
                    onClick={() => setShowAccessManager(true)}
                    className="text-zinc-500 hover:text-amber-500 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Gestionar acceso"
                  >
                    <Users size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Categories - desktop sidebar */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">
                Categorias
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory("Todas")}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                    activeCategory === "Todas"
                      ? "bg-amber-500/10 text-amber-500 font-semibold"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <span className="text-lg">📖</span> Todas
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                      activeCategory === cat.name
                        ? "bg-amber-500/10 text-amber-500 font-semibold"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Diets - desktop sidebar */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">
                Dietas
              </h3>
              <div className="space-y-1">
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
                      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-500 font-semibold"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        diet.name === "Keto" ? "bg-purple-400" :
                        diet.name === "Low Carb" ? "bg-green-400" :
                        diet.name === "Carnivora" ? "bg-red-400" :
                        "bg-blue-400"
                      }`} />
                      {diet.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ============ MAIN CONTENT ============ */}
        <div className="flex-1 min-w-0 lg:px-0 lg:pt-0 pb-32 lg:pb-10">

          {/* ---- Mobile: search + filters area (more spacious) ---- */}
          <div className="lg:hidden">
            {/* Search bar - always visible, comfortable padding */}
            <div className="px-5 pt-5 pb-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Favorites toggle + Category filters */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2.5 mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Categorias</p>
              </div>
              <div className="flex gap-2.5 items-center">
                {/* Favorites pill */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    showFavoritesOnly
                      ? "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-[#18181b] border-zinc-800 text-zinc-400 active:scale-95"
                  }`}
                >
                  <Heart size={14} className={showFavoritesOnly ? "fill-red-400" : ""} />
                  Favoritos
                </button>
              </div>
            </div>

            <div className="pb-3">
              <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
            </div>

            {/* Diet filters */}
            <div className="px-5 pb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Dietas</p>
            </div>
            <div className="pb-4">
              <DietFilter active={activeDiets} onChange={setActiveDiets} />
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-zinc-800/60 mb-4" />
          </div>

          {/* Recipe count + clear filters */}
          <div className="flex items-center justify-between mb-5 px-5 lg:px-0">
            <p className="text-sm text-zinc-500 font-medium">
              {showFavoritesOnly && (
                <Heart size={13} className="inline fill-red-400 text-red-400 mr-1.5 -mt-0.5" />
              )}
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "receta" : "recetas"}
              {activeCategory !== "Todas" && (
                <span className="text-zinc-400 ml-1.5">
                  en {getCategoryEmoji(activeCategory)} {activeCategory}
                </span>
              )}
              {showFavoritesOnly && (
                <span className="text-red-400/70 ml-1.5">en favoritos</span>
              )}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-amber-500 hover:text-amber-400 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Recipe grid */}
          <div className="px-5 lg:px-0">
            {recipesLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-amber-500" size={36} />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-zinc-800 rounded-3xl">
                {recipes.length === 0 ? (
                  <>
                    <ChefHat className="text-zinc-700 mx-auto mb-5" size={56} />
                    <p className="text-zinc-400 text-lg mb-2 font-medium">
                      No hay recetas aun
                    </p>
                    <p className="text-zinc-600 text-sm mb-8 max-w-xs mx-auto">
                      Agrega tu primera receta desde una URL, foto o PDF
                    </p>
                    <button
                      onClick={() => setShowImport(true)}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-colors"
                    >
                      <Plus size={18} />
                      Agregar receta
                    </button>
                  </>
                ) : showFavoritesOnly ? (
                  <>
                    <Heart className="text-zinc-700 mx-auto mb-5" size={56} />
                    <p className="text-zinc-400 text-lg font-medium">
                      No tienes recetas favoritas aun
                    </p>
                    <p className="text-zinc-600 text-sm mt-2 max-w-xs mx-auto">
                      Toca el corazon en las recetas que mas te gusten
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="text-zinc-700 mx-auto mb-5" size={56} />
                    <p className="text-zinc-400 text-lg font-medium">
                      No se encontraron recetas con estos filtros
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
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
        </div>
      </div>

      {/* ============ MOBILE FAB - Add recipe (hidden on desktop) ============ */}
      <button
        onClick={() => setShowImport(true)}
        className="fixed right-5 bottom-8 z-50 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black p-4 rounded-2xl shadow-xl shadow-amber-500/30 transition-all lg:hidden safe-bottom-fab"
        aria-label="Agregar receta"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSave={handleSaveRecipes}
        />
      )}

      {/* Access manager modal (admin only) */}
      {showAccessManager && user?.email && (
        <AccessManager
          userEmail={user.email}
          onClose={() => setShowAccessManager(false)}
        />
      )}
    </main>
  );
}
