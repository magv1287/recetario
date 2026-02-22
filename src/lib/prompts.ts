import { MealType } from "./types";

export function getWeeklyPlanPrompt(portions: number, existingRecipeTitles: string[] = []): string {
  const excludeClause = existingRecipeTitles.length > 0
    ? `\nRECETAS YA USADAS (NO repetir):\n${existingRecipeTitles.slice(-30).map(t => `- ${t}`).join("\n")}`
    : "";

  return `Crea un plan de comidas para 7 dias (desayuno, almuerzo, cena). Sé un chef creativo con cocina internacional.

VARIEDAD:
- Mezcla 5+ cocinas: mexicana, asiática, mediterránea, peruana, francesa, india, etc.
- No repetir perfil de sabor dos dias seguidos
- Alternar proteínas: pollo (max 3/semana), res, cerdo, pescado, salmón, camarones, pavo, huevos, cordero
- Variar técnicas: plancha, horno, salteado, parrilla, estofado

DIETA (obligatorio):
- Proteínas: mínimo 30g por comida
- Carbohidratos: máximo 10g netos por comida
- Verduras solo de bajo IG: brócoli, espinaca, coliflor, calabacín, espárragos, champiñones, pimiento, kale, bok choy, berenjena
- Frutas SOLO en almuerzo: fresas, arándanos, frambuesas, aguacate
- NO frutas en desayuno ni cena
- Grasas OK: aceite oliva, aguacate, mantequilla, ghee, queso, crema, frutos secos
- PROHIBIDO: azúcar, harinas, pan, pasta, arroz, papa, maíz, cereales, avena, legumbres

PORCIONES: ${portions}

PASOS: 4-6 pasos detallados con temperaturas, tiempos y señales visuales.
INGREDIENTES: cantidades exactas (gramos, cucharadas, unidades).
DESCRIPCION: 1-2 frases apetitosas.${excludeClause}

Devuelve SOLO JSON válido:
{
  "meals": {
    "monday": {
      "breakfast": { "title": "Nombre", "description": "...", "category": "Desayunos", "diets": ["Low Carb"], "ingredients": ["200g pollo, en tiras"], "steps": ["Paso detallado..."], "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 } },
      "lunch": { "title": "...", "description": "...", "category": "Carnes", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 40, "carbs": 8, "fat": 25, "calories": 420 } },
      "dinner": { "title": "...", "description": "...", "category": "Cenas", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 38, "carbs": 6, "fat": 22, "calories": 380 } }
    },
    "tuesday": { ... }, "wednesday": { ... }, "thursday": { ... }, "friday": { ... }, "saturday": { ... }, "sunday": { ... }
  }
}

Categorías: Sopas, Carnes, Pescados, Ensaladas, Desayunos, Cenas, Snacks, Otros
Dietas: Keto, Low Carb, Carnivora, Mediterranea

SOLO JSON, nada más.`;
}

export function getSwapRecipePrompt(
  mealType: MealType,
  portions: number,
  currentTitle: string,
  excludeTitles: string[] = []
): string {
  const mealLabel = mealType === "breakfast" ? "desayuno" : mealType === "lunch" ? "almuerzo" : "cena";
  const fruitNote = mealType === "lunch"
    ? "Frutas permitidas: fresas, arándanos, frambuesas, aguacate."
    : "NO frutas.";

  const allExcluded = [currentTitle, ...excludeTitles].filter(Boolean);

  return `Genera UNA receta alternativa para ${mealLabel}, diferente en sabor y cocina a las listadas.

DIETA: alta proteína (30g+), max 10g carbs netos, verduras bajo IG, grasas saludables OK. ${fruitNote}
PROHIBIDO: azúcar, harinas, pan, pasta, arroz, papa, maíz, cereales, legumbres.
PORCIONES: ${portions}

EVITAR (ser MUY diferente):
${allExcluded.slice(-15).map(t => `- ${t}`).join("\n")}

Pasos: 4-6 detallados con temperaturas y tiempos. Ingredientes con cantidades exactas.

SOLO JSON:
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
}

export function getShoppingListPrompt(allIngredients: string[]): string {
  return `Consolida estos ingredientes en una lista de compras organizada:

${allIngredients.join("\n")}

REGLAS:
1. Suma cantidades iguales (200g pollo + 300g pollo = 500g)
2. Redondea a cantidades prácticas
3. Agrupa por sección del supermercado
4. Unifica genéricos y específicos

SOLO JSON:
{
  "items": [
    { "name": "Pechuga de pollo", "quantity": "1.5 kg", "category": "Proteinas" },
    { "name": "Brócoli", "quantity": "3 unidades", "category": "Verduras" }
  ]
}

Categorías: Proteinas, Verduras, Frutas, Lácteos, Condimentos, Otros

SOLO JSON, nada más.`;
}
