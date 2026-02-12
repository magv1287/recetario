"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useRecipes } from "@/hooks/useRecipes";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DietFilter } from "@/components/DietFilter";
import { SearchBar } from "@/components/SearchBar";
import { RecipeCard } from "@/components/RecipeCard";
import { ImportModal } from "@/components/ImportModal";
import { Category, Diet, ExtractedRecipe } from "@/lib/types";
import { CATEGORIES, DIETS } from "@/lib/categories";
import { getCategoryEmoji } from "@/lib/categories";
import {
  Plus,
  ChefHat,
  Search,
  Home,
  Loader2,
  LogOut,
} from "lucide-react";

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuthContext();
  const router = useRouter();
  const { recipes, loading: recipesLoading, addRecipe } = useRecipes(user?.uid);

  const [activeCategory, setActiveCategory] = useState<"Todas" | Category>("Todas");
  const [activeDiets, setActiveDiets] = useState<Diet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

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
  }, [recipes, activeCategory, activeDiets, searchQuery]);

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
  };

  const hasFilters = activeCategory !== "Todas" || activeDiets.length > 0 || searchQuery;

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
      <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHat className="text-amber-500" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Recetario
            </h1>
          </div>

          {/* Desktop: search + add button in header */}
          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl mx-8">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop: Add recipe button */}
            <button
              onClick={() => setShowImport(true)}
              className="hidden lg:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              <Plus size={18} />
              Nueva receta
            </button>

            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full border border-zinc-800"
              />
            )}
            <button
              onClick={signOut}
              className="text-zinc-500 hover:text-zinc-300 p-1.5"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ DESKTOP LAYOUT: sidebar + content ============ */}
      <div className="max-w-7xl mx-auto lg:px-8 lg:flex lg:gap-8 lg:pt-6">

        {/* ---- Desktop Sidebar ---- */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 space-y-6">
            {/* User info */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <ChefHat className="text-amber-500" size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {user?.displayName || "Chef"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  {recipes.length} {recipes.length === 1 ? "receta" : "recetas"} guardadas
                </p>
              </div>
            </div>

            {/* Categories - desktop sidebar */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
                Categorías
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory("Todas")}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors ${
                    activeCategory === "Todas"
                      ? "bg-amber-500/10 text-amber-500 font-medium"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <span>📖</span> Todas
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors ${
                      activeCategory === cat.name
                        ? "bg-amber-500/10 text-amber-500 font-medium"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <span>{cat.emoji}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Diets - desktop sidebar */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
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
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-500 font-medium"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
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
        <div className="flex-1 min-w-0 px-4 lg:px-0 pt-4 lg:pt-0 pb-24 lg:pb-8">
          {/* Mobile: search bar (toggled) */}
          {showSearch && (
            <div className="lg:hidden animate-fadeIn mb-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          )}

          {/* Mobile: horizontal filters */}
          <div className="lg:hidden space-y-3 mb-4">
            <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
            <DietFilter active={activeDiets} onChange={setActiveDiets} />
          </div>

          {/* Recipe count + clear filters */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "receta" : "recetas"}
              {activeCategory !== "Todas" && (
                <span className="text-zinc-500 normal-case ml-1">
                  en {getCategoryEmoji(activeCategory)} {activeCategory}
                </span>
              )}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-amber-500 hover:text-amber-400"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Recipe grid */}
          {recipesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl">
              {recipes.length === 0 ? (
                <>
                  <ChefHat className="text-zinc-700 mx-auto mb-4" size={48} />
                  <p className="text-zinc-500 text-sm mb-2">
                    No hay recetas aún
                  </p>
                  <p className="text-zinc-600 text-xs mb-6">
                    Agrega tu primera receta desde una URL, foto o PDF
                  </p>
                  <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 bg-amber-500 text-black font-bold px-6 py-2.5 rounded-full text-sm"
                  >
                    <Plus size={16} />
                    Agregar receta
                  </button>
                </>
              ) : (
                <>
                  <Search className="text-zinc-700 mx-auto mb-4" size={48} />
                  <p className="text-zinc-500 text-sm">
                    No se encontraron recetas con estos filtros
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => router.push(`/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ MOBILE BOTTOM NAV (hidden on desktop) ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-t border-zinc-800/50 safe-bottom lg:hidden">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 ${
              !showSearch ? "text-amber-500" : "text-zinc-600"
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 ${
              showSearch ? "text-amber-500" : "text-zinc-600"
            }`}
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">Buscar</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-4"
          >
            <div className="bg-amber-500 p-2 rounded-full -mt-5 shadow-lg shadow-amber-500/20">
              <Plus size={22} className="text-black" />
            </div>
            <span className="text-[10px] font-medium text-amber-500">
              Agregar
            </span>
          </button>
        </div>
      </nav>

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSave={handleSaveRecipes}
        />
      )}
    </main>
  );
}
