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
  | "Otros";

export type Diet = "Keto" | "Low Carb" | "Carnivora" | "Mediterranea";

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
