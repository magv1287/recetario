import { Category, Diet } from "./types";

export const CATEGORIES: { name: Category; emoji: string }[] = [
  { name: "Sopas", emoji: "🍲" },
  { name: "Carnes", emoji: "🥩" },
  { name: "Pescados", emoji: "🐟" },
  { name: "Postres", emoji: "🍰" },
  { name: "Ensaladas", emoji: "🥗" },
  { name: "Pastas", emoji: "🍝" },
  { name: "Arroces", emoji: "🍚" },
  { name: "Snacks", emoji: "🥨" },
  { name: "Desayunos", emoji: "🥞" },
  { name: "Otros", emoji: "🍽️" },
];

export const DIETS: { name: Diet; color: string }[] = [
  { name: "Keto", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { name: "Low Carb", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { name: "Carnivora", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  { name: "Mediterranea", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
];

export const ALL_CATEGORIES: ("Todas" | Category)[] = [
  "Todas",
  ...CATEGORIES.map((c) => c.name),
];

export function getCategoryEmoji(category: Category): string {
  return CATEGORIES.find((c) => c.name === category)?.emoji || "🍽️";
}

export function getDietStyle(diet: Diet): string {
  return DIETS.find((d) => d.name === diet)?.color || "bg-zinc-500/20 text-zinc-300";
}
