import { Timestamp } from "firebase/firestore";

export type Category =
  | "Sopas"
  | "Carnes"
  | "Pescados"
  | "Postres"
  | "Ensaladas"
  | "Pastas"
  | "Arroces"
  | "Snacks"
  | "Desayunos"
  | "Cenas"
  | "Otros";

export type Diet = "Keto" | "Low Carb" | "Carnivora" | "Mediterranea";

export type RecipeSource = "ai" | "manual" | "imported";

export type MealType = "breakfast" | "lunch" | "dinner";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miercoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sabado",
  sunday: "Domingo",
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
};

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: Category;
  diets: Diet[];
  ingredients: string[];
  steps: string[];
  imageUrl: string;
  sourceUrl?: string;
  source?: RecipeSource;
  macros?: Macros;
  mealType?: MealType;
  userId: string;
  createdAt: Timestamp;
}

export interface RecipeFormData {
  title: string;
  description: string;
  category: Category;
  diets: Diet[];
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  imageFile?: File;
  sourceUrl?: string;
}

export interface ExtractedRecipe {
  title: string;
  description: string;
  category: Category;
  diets: Diet[];
  ingredients: string[];
  steps: string[];
  imageSearchTerm?: string;
  imageUrl?: string;
}

export interface PDFPreviewData {
  totalPages: number;
  fileName: string;
}

export interface MealSlot {
  recipeId: string;
  locked: boolean;
}

export interface DayMeals {
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
}

export type WeeklyPlanStatus = "draft" | "confirmed" | "shopping_sent";

export interface WeeklyPlan {
  id: string;
  userId: string;
  portions: number;
  status: WeeklyPlanStatus;
  generatedAt: Timestamp;
  meals: Record<DayOfWeek, DayMeals>;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  userId: string;
  items: ShoppingItem[];
  bringListId?: string;
  syncedToBring: boolean;
  generatedAt: Timestamp;
}

export interface CronStatus {
  lastRun: Timestamp;
  weekId: string;
  success: boolean;
}

export interface PrepGuideStep {
  phase: string;
  instructions: string[];
  timing: string;
}

export interface PrepGuide {
  id: string;
  userId: string;
  steps: PrepGuideStep[];
  generatedAt: Timestamp;
}
