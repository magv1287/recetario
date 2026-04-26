import { MealType } from "./types";
import {
  DIET_RULES,
  VARIETY_RULES,
  COOKING_INSTRUCTIONS,
  SHOPPING_LIST_RULES,
  PREP_GUIDE_RULES,
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

TÍTULOS ÚNICOS: los 21 campos "title" (todos los desayunos, almuerzos y cenas) deben ser 21 textos distintos. Comparación sin importar mayúsculas: ningún título puede repetirse. Si dos comidas usan la misma base en batch, los títulos deben diferir (ej. distinto corte, salsa, guarnición o estilo de plato).

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

REGLA ANTI-DUPLICADOS (obligatoria): revisa el JSON antes de responder. Ningún "title" puede repetirse en toda la semana (21 títulos únicos). Si ya generaste un título, el siguiente plato similar debe llevar otro nombre completo.

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
  const fruitNote = mealType === "dinner"
    ? "NO frutas en cena (aguacate sí permitido siempre)."
    : "Berries permitidas (arándanos, frambuesas, fresas, moras): un puñado como topping o acompañamiento.";
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

export type ShoppingListRecipeBlock = { title: string; ingredients: string[] };

export function getShoppingListPrompt(recipes: ShoppingListRecipeBlock[], portions: number): string {
  const proteinPerMealLb = (portions * 0.5).toFixed(1);
  const proteinPerMealG = Math.round(portions * 227);
  const blocks = recipes
    .map((r, i) => {
      const lines = r.ingredients.length > 0 ? r.ingredients.join("\n") : "(sin líneas de ingredientes guardadas — usa el título y la regla de porciones)";
      return `--- RECETA ${i + 1}: ${r.title} ---\n${lines}`;
    })
    .join("\n\n");

  return `Consolida en UNA lista de compras los ingredientes de TODAS las recetas del plan (cada bloque es una comida con su título e ingredientes tal como están en la app).

PORCIONES DEL PLAN: ${portions} personas.
Referencia para inferir proteínas faltantes en almuerzos/cenas: ~${proteinPerMealLb} lb (${proteinPerMealG}g) de proteína principal en TOTAL por comida con carne/pescado/mariscos, salvo que las líneas indiquen otra cantidad.

${blocks}

REGLAS:
${SHOPPING_LIST_RULES}

${JSON_FORMAT_SHOPPING}`;
}

const JSON_FORMAT_PREP_GUIDE = `SOLO JSON:
{
  "steps": [
    {
      "phase": "Mise en place (30 min)",
      "timing": "30 min",
      "instructions": [
        "Instrucción detallada 1...",
        "Instrucción detallada 2..."
      ]
    },
    {
      "phase": "Horno - Tanda 1 (45 min)",
      "timing": "45 min",
      "instructions": ["..."]
    }
  ]
}

SOLO JSON, nada más.`;

export function getPrepGuidePrompt(recipeSummaries: string[], portions: number): string {
  return `${PREP_GUIDE_RULES}

PORCIONES: ${portions} personas.
IMPORTANTE: Las cantidades de ingredientes en las recetas ya son el TOTAL para ${portions} personas. Usa EXACTAMENTE esas cantidades en la guía. NO dividas ni modifiques las cantidades — cópialas tal cual aparecen en cada receta. Cuando agrupes proteínas iguales, SUMA las cantidades de todas las recetas que usen esa proteína.

RECETAS DE LA SEMANA (almuerzos y cenas, lunes a sábado):
${recipeSummaries.join("\n\n")}

Crea la guía de prep del domingo organizada por FASES (no por receta). Agrupa las tareas para máxima eficiencia. Incluir cantidades exactas en cada instrucción.

${JSON_FORMAT_PREP_GUIDE}`;
}
