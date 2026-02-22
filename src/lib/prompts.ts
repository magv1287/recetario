import { MealType } from "./types";

const DIET_RULES = `DIETA ANTI-INFLAMATORIA (basada en recomendaciones del Dr. Guillermo Navarrete y Dr. Bayter):
- Proteínas: mínimo 30g por comida (pollo, res, cerdo, pescado, mariscos, huevos, cordero, pavo)
- Carbohidratos: máximo 10g netos por comida
- ACEITES: SOLO aceite de oliva extra virgen o aceite de coco. PROHIBIDO cualquier aceite vegetal (canola, girasol, soja, maíz, cártamo)
- MANTEQUILLA: siempre con sal
- AGUACATE: usar generosamente en TODAS las comidas (medio a un aguacate entero por porción). Es la grasa estrella.
- Grasas saludables: aceite de oliva extra virgen, aceite de coco, aguacate, frutos secos, mantequilla con sal, ghee, queso, crema
- Verduras solo de bajo IG: brócoli, espinaca, coliflor, calabacín, espárragos, champiñones, pimiento, kale, bok choy, berenjena, apio, pepino, rúcula, rábano
- Frutas SOLO en almuerzo y limitadas: fresas, arándanos, frambuesas
- NO frutas en desayuno ni cena (aguacate sí permitido siempre)
- PROHIBIDO: azúcar, miel, agave, harinas, pan, pasta, arroz, papa, maíz, cereales, avena, legumbres, aceites vegetales/semillas, margarina, alimentos ultraprocesados
- Priorizar alimentos reales, antiinflamatorios, sin procesados`;

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
- Incluir aguacate de forma creativa en la mayoría de las comidas (guacamole, rodajas, relleno, salsa, aderezo)

${DIET_RULES}

PORCIONES: ${portions}

PASOS: 4-6 pasos detallados con temperaturas, tiempos y señales visuales.
INGREDIENTES: cantidades exactas (gramos, cucharadas, unidades). Siempre especificar "aceite de oliva extra virgen" o "aceite de coco", nunca solo "aceite".
DESCRIPCION: 1-2 frases apetitosas.${excludeClause}

Devuelve SOLO JSON válido:
{
  "meals": {
    "monday": {
      "breakfast": { "title": "Nombre", "description": "...", "category": "Desayunos", "diets": ["Low Carb"], "ingredients": ["200g pollo, en tiras", "1 aguacate maduro, en rodajas", "2 cucharadas de aceite de oliva extra virgen"], "steps": ["Paso detallado..."], "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 } },
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
    ? "Frutas permitidas en almuerzo: fresas, arándanos, frambuesas."
    : "NO frutas (aguacate sí permitido siempre).";

  const allExcluded = [currentTitle, ...excludeTitles].filter(Boolean);

  return `Genera UNA receta alternativa para ${mealLabel}, diferente en sabor y cocina a las listadas.

${DIET_RULES}
${fruitNote}
Incluir aguacate generosamente.
PORCIONES: ${portions}

EVITAR (ser MUY diferente):
${allExcluded.slice(-15).map(t => `- ${t}`).join("\n")}

Pasos: 4-6 detallados con temperaturas y tiempos. Ingredientes con cantidades exactas.
Siempre especificar "aceite de oliva extra virgen" o "aceite de coco", nunca solo "aceite".

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
5. Si aparece "aceite" sin especificar, siempre poner "Aceite de oliva extra virgen"
6. Asegurarse de incluir suficientes aguacates (sumar todos los que aparezcan)

SOLO JSON:
{
  "items": [
    { "name": "Pechuga de pollo", "quantity": "1.5 kg", "category": "Proteinas" },
    { "name": "Aguacate", "quantity": "14 unidades", "category": "Verduras" },
    { "name": "Aceite de oliva extra virgen", "quantity": "1 botella", "category": "Condimentos" }
  ]
}

Categorías: Proteinas, Verduras, Frutas, Lácteos, Condimentos, Otros

SOLO JSON, nada más.`;
}
