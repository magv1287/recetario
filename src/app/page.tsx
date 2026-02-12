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

    // Category filter
    if (activeCategory !== "Todas") {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    // Diet filter
    if (activeDiets.length > 0) {
      filtered = filtered.filter((r) =>
        activeDiets.some((d) => r.diets?.includes(d))
      );
    }

    // Search filter
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

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHat className="text-amber-500" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Recetario
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-7 h-7 rounded-full"
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

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Search bar */}
        {showSearch && (
          <div className="animate-fadeIn">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}

        {/* Category filter */}
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

        {/* Diet filter */}
        <DietFilter active={activeDiets} onChange={setActiveDiets} />

        {/* Recipe count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600 uppercase tracking-wider">
            {filteredRecipes.length}{" "}
            {filteredRecipes.length === 1 ? "receta" : "recetas"}
          </p>
          {(activeCategory !== "Todas" ||
            activeDiets.length > 0 ||
            searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory("Todas");
                setActiveDiets([]);
                setSearchQuery("");
              }}
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
                  Toca el + para agregar tu primera receta
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-t border-zinc-800/50 safe-bottom">
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
