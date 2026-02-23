import { MealType } from "./types";
import {
  DIET_RULES,
  VARIETY_RULES,
  COOKING_INSTRUCTIONS,
  SHOPPING_LIST_RULES,
  AI_ROLE,
  AI_SWAP_ROLE,
} from "./prompts.config";

// --- NO EDITAR ESTE ARCHIVO ---
// Edita src/lib/prompts.config.ts para cambiar lo que se le dice a Gemini
// Este archivo solo maneja el formato JSON técnico

const JSON_FORMAT_WEEKLY = `Devuelve SOLO JSON válido:
{
  "meals": {
    "monday": {
      "breakfast": { "title": "Nombre", "description": "...", "category": "Desayunos", "diets": ["Low Carb"], "ingredients": ["0.5 lb (227g) pollo, en tiras", "1 aguacate maduro, en rodajas", "2 cucharadas de aceite de oliva extra virgen"], "steps": ["Paso detallado..."], "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 } },
      "lunch": { "title": "...", "description": "...", "category": "Carnes", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 40, "carbs": 8, "fat": 25, "calories": 420 } },
      "dinner": { "title": "...", "description": "...", "category": "Cenas", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 38, "carbs": 6, "fat": 22, "calories": 380 } }
    },
    "tuesday": { ... }, "wednesday": { ... }, "thursday": { ... }, "friday": { ... }, "saturday": { ... }, "sunday": { ... }
  }
}

Categorías: Sopas, Carnes, Pescados, Ensaladas, Desayunos, Cenas, Snacks, Otros
Dietas: Keto, Low Carb, Carnivora, Mediterranea

SOLO JSON, nada más.`;

const JSON_FORMAT_SWAP = `SOLO JSON:
{
  "title": "Nombre apetitoso",
  "description": "1-2 frases con sabores y texturas",
  "category": "Desayunos|Carnes|Pescados|Ensaladas|Cenas|Sopas|Otros",
  "diets": ["Low Carb"],
  "ingredients": ["cantidad + ingrediente + preparación"],
  "steps": ["Paso detallado..."],
  "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 }
}

SOLO JSON, nada más.`;

const JSON_FORMAT_SHOPPING = `SOLO JSON:
{
  "items": [
    { "name": "Pechuga de pollo", "quantity": "3.3 lb (1.5 kg)", "category": "Proteinas" },
    { "name": "Aguacate", "quantity": "5 unidades", "category": "Verduras" },
    { "name": "Aceite de oliva extra virgen", "quantity": "1 botella", "category": "Condimentos" }
  ]
}

Categorías: Proteinas, Verduras, Frutas, Lácteos, Condimentos, Otros

SOLO JSON, nada más.`;

export function getWeeklyPlanPrompt(portions: number, existingRecipeTitles: string[] = []): string {
  const excludeClause = existingRecipeTitles.length > 0
    ? `\nRECETAS YA USADAS (NO repetir):\n${existingRecipeTitles.slice(-30).map(t => `- ${t}`).join("\n")}`
    : "";

  return `${AI_ROLE}

VARIEDAD:
${VARIETY_RULES}

${DIET_RULES}

PORCIONES: ${portions} personas.
IMPORTANTE: Todas las cantidades de ingredientes deben ser el TOTAL para ${portions} personas. La proteína debe ser ${portions} x 0.5 lb = ${(portions * 0.5).toFixed(1)} lb (${Math.round(portions * 227)}g) por comida en TOTAL. NO poner cantidades para 1 persona.

${COOKING_INSTRUCTIONS}${excludeClause}

${JSON_FORMAT_WEEKLY}`;
}

export function getSwapRecipePrompt(
  mealType: MealType,
  portions: number,
  currentTitle: string,
  excludeTitles: string[] = []
): string {
  const mealLabel = mealType === "breakfast" ? "desayuno" : mealType === "lunch" ? "almuerzo" : "cena";
  const fruitNote = mealType === "lunch"
    ? "Frutas permitidas en almuerzo: fresas, arándanos, frambuesas."
    : "NO frutas (aguacate sí permitido siempre).";
  const allExcluded = [currentTitle, ...excludeTitles].filter(Boolean);

  return `${AI_SWAP_ROLE} Para ${mealLabel}.

${DIET_RULES}
${fruitNote}
PORCIONES: ${portions} personas.
IMPORTANTE: Todas las cantidades deben ser el TOTAL para ${portions} personas. Proteína: ${(portions * 0.5).toFixed(1)} lb (${Math.round(portions * 227)}g) por comida en TOTAL.

EVITAR (ser MUY diferente):
${allExcluded.slice(-15).map(t => `- ${t}`).join("\n")}

${COOKING_INSTRUCTIONS}

${JSON_FORMAT_SWAP}`;
}

export function getShoppingListPrompt(allIngredients: string[]): string {
  return `Consolida estos ingredientes en una lista de compras organizada:

${allIngredients.join("\n")}

REGLAS:
${SHOPPING_LIST_RULES}

${JSON_FORMAT_SHOPPING}`;
}
