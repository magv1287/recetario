import { MealType } from "./types";

export function getWeeklyPlanPrompt(portions: number, existingRecipeTitles: string[] = []): string {
  const excludeClause = existingRecipeTitles.length > 0
    ? `\nRECETAS YA USADAS (NO repetir ninguna de estas, ni variaciones similares):\n${existingRecipeTitles.map(t => `- ${t}`).join("\n")}`
    : "";

  return `Eres un chef profesional con 20 años de experiencia en cocina internacional y un nutricionista especializado en dietas bajas en carbohidratos. Tu trabajo es crear un plan de comidas EXTRAORDINARIO para 7 dias.

BUSCA EN INTERNET recetas reales y populares de cocina internacional que se adapten a las restricciones. Inspírate en recetas de blogs de cocina keto/low carb, canales de YouTube de cocina, y libros de recetas. NO inventes recetas genéricas — busca platos reales con nombre propio.

VARIEDAD OBLIGATORIA DE COCINAS Y SABORES:
- Mezcla al menos 5 cocinas diferentes durante la semana: mexicana, italiana, asiática (tailandesa, japonesa, coreana, china), mediterránea, americana, peruana, argentina, española, francesa, griega, india, marroquí, turca, etc.
- NUNCA repitas el mismo perfil de sabor dos dias seguidos (si el lunes es mediterráneo, el martes debe ser asiático o latinoamericano, etc.)
- Usa diferentes técnicas de cocción: a la plancha, al horno, salteado, a la parrilla, al vapor, estofado, crudo (ceviches, tartares), marinado
- Varía las proteínas: no uses pollo más de 3 veces en la semana, alterna entre res, cerdo, pescado blanco, salmón, atún, camarones, pulpo, cordero, pavo, huevos
- Varía los sabores y condimentos: un día curry y leche de coco, otro día chimichurri, otro día salsa de soja y jengibre, otro día pesto, otro día harissa, otro día miso

RESTRICCIONES DIETETICAS (innegociables):
- Alta en proteínas: CADA comida debe tener al menos 30g de proteína
- Muy baja en carbohidratos: máximo 10g de carbohidratos netos por comida
- Verduras permitidas SOLO de bajo índice glucémico: brócoli, espinaca, coliflor, calabacín, espárragos, lechuga, pepino, apio, repollo, kale, pimiento, champiñones, berenjena, tomate con moderación, bok choy, rúcula, rábano, nabo
- Frutas: SOLO permitidas en el ALMUERZO y limitadas a: fresas, arándanos, frambuesas, aguacate
- NO incluir frutas en desayuno ni cena bajo ninguna circunstancia
- Grasas saludables: aceite de oliva, aguacate, frutos secos, mantequilla, ghee, queso, crema, aceite de coco, aceite de sésamo
- PROHIBIDO: azúcar, miel, agave, harinas, pan, pasta, arroz, papa, batata, maíz, cereales, avena, tortillas, legumbres, granos

PORCIONES: ${portions} persona(s)

FORMATO DE PASOS DE PREPARACION (MUY IMPORTANTE):
Cada paso debe ser detallado y específico para que alguien sin experiencia pueda seguirlo:
- Incluir temperaturas exactas ("precalienta el horno a 200°C", "calienta la sartén a fuego medio-alto")
- Incluir tiempos exactos ("cocina por 4 minutos por cada lado", "hornea durante 25 minutos")
- Incluir señales visuales ("hasta que esté dorado", "hasta que suelte jugo claro", "hasta que las burbujas se formen en la superficie")
- Incluir técnicas específicas ("corta en juliana fina", "marina durante 30 minutos en refrigeración", "sella la carne sin moverla para crear costra")
- Mínimo 5 pasos por receta, máximo 10
- Incluir tips de cocina cuando sea relevante ("deja reposar la carne 5 minutos antes de cortar para que retenga sus jugos")

REGLAS ADICIONALES:
- Cada una de las 21 recetas debe ser completamente diferente — diferentes ingredientes principales, diferentes salsas, diferentes técnicas
- Los desayunos deben ser variados: no solo huevos revueltos. Incluye omelettes elaborados, frittatas, shakshuka, huevos benedictinos (sin pan, con base de champiñón), pancakes de queso crema, etc.
- Los ingredientes deben incluir cantidades EXACTAS y unidades claras (gramos, cucharadas, tazas, unidades)
- La descripción de cada receta debe ser apetitosa y descriptiva (2-3 frases), mencionando sabores y texturas clave
- Macros aproximados por porción${excludeClause}

Devuelve UNICAMENTE un JSON válido (sin markdown, sin backticks, sin explicaciones) con esta estructura exacta:
{
  "meals": {
    "monday": {
      "breakfast": { "title": "Nombre descriptivo y apetitoso", "description": "Descripción de 2-3 frases que haga agua la boca", "category": "Desayunos", "diets": ["Low Carb"], "ingredients": ["300g pechuga de pollo, cortada en tiras finas", "2 cucharadas de aceite de oliva extra virgen"], "steps": ["Paso muy detallado con temperaturas y tiempos", "...mínimo 5 pasos"], "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 } },
      "lunch": { "title": "...", "description": "...", "category": "Carnes|Pescados|Ensaladas", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 40, "carbs": 8, "fat": 25, "calories": 420 } },
      "dinner": { "title": "...", "description": "...", "category": "Carnes|Pescados|Cenas", "diets": ["Low Carb"], "ingredients": ["..."], "steps": ["..."], "macros": { "protein": 38, "carbs": 6, "fat": 22, "calories": 380 } }
    },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... },
    "sunday": { ... }
  }
}

Categorías válidas: Sopas, Carnes, Pescados, Postres, Ensaladas, Pastas, Arroces, Snacks, Desayunos, Cenas, Otros
Dietas válidas: Keto, Low Carb, Carnivora, Mediterranea (incluye las que apliquen)

IMPORTANTE: Devuelve SOLO el JSON, nada más.`;
}

export function getSwapRecipePrompt(
  mealType: MealType,
  portions: number,
  currentTitle: string,
  excludeTitles: string[] = []
): string {
  const mealLabel = mealType === "breakfast" ? "desayuno" : mealType === "lunch" ? "almuerzo" : "cena";
  const fruitNote = mealType === "lunch"
    ? "Puedes incluir frutas bajas en azúcar (fresas, arándanos, frambuesas, aguacate)."
    : "NO incluir frutas bajo ninguna circunstancia.";

  const allExcluded = [currentTitle, ...excludeTitles].filter(Boolean);

  return `Eres un chef profesional especializado en cocina internacional y nutrición low carb. BUSCA EN INTERNET una receta real y popular que sea diferente a las listadas abajo.

Genera UNA receta alternativa para ${mealLabel} que sea completamente diferente en sabor, cocina y técnica.

BUSCA inspiración en recetas reales de blogs de cocina keto, canales de cocina, o libros de recetas internacionales. Elige una cocina diferente (si la anterior era mediterránea, elige asiática, mexicana, peruana, etc.).

RESTRICCIONES DIETETICAS:
- Alta en proteínas: mínimo 30g por porción (pollo, carne de res, cerdo, pescado, mariscos, huevos, cordero, pavo)
- Muy baja en carbohidratos: máximo 10g netos (sin pan, pasta, arroz, papa, cereales, legumbres)
- Verduras de bajo índice glucémico solamente (brócoli, espinaca, coliflor, calabacín, espárragos, champiñones, pimiento, etc.)
- ${fruitNote}
- Grasas saludables permitidas (aceite de oliva, aguacate, frutos secos, mantequilla, ghee, queso, crema)

PORCIONES: ${portions} persona(s)

RECETAS A EVITAR (la nueva debe ser MUY diferente en sabores e ingredientes):
${allExcluded.map(t => `- ${t}`).join("\n")}

FORMATO DE PASOS (obligatorio):
- Mínimo 5 pasos detallados
- Incluir temperaturas exactas y tiempos de cocción
- Incluir señales visuales ("hasta que esté dorado", "hasta que burbujee")
- Incluir técnicas específicas y tips de cocina
- Que cualquier persona pueda seguir los pasos sin experiencia previa

La descripción debe ser apetitosa, mencionando sabores y texturas (2-3 frases).
Los ingredientes deben incluir cantidades EXACTAS con unidades claras.

Devuelve UNICAMENTE un JSON válido:
{
  "title": "Nombre descriptivo y apetitoso de la receta",
  "description": "Descripción apetitosa de 2-3 frases con sabores y texturas",
  "category": "Desayunos|Carnes|Pescados|Ensaladas|Cenas|Sopas|Otros",
  "diets": ["Low Carb"],
  "ingredients": ["cantidad exacta + ingrediente + indicación de corte/preparación"],
  "steps": ["Paso 1 muy detallado con temperatura y tiempo", "Paso 2...", "mínimo 5 pasos"],
  "macros": { "protein": 35, "carbs": 5, "fat": 20, "calories": 340 }
}

Categorías válidas: Sopas, Carnes, Pescados, Postres, Ensaladas, Pastas, Arroces, Snacks, Desayunos, Cenas, Otros
Dietas válidas: Keto, Low Carb, Carnivora, Mediterranea

IMPORTANTE: Devuelve SOLO el JSON, nada más.`;
}

export function getShoppingListPrompt(allIngredients: string[]): string {
  return `Eres un asistente de compras experto. Recibe una lista de ingredientes de múltiples recetas y debes consolidarlos en una lista de compras organizada y práctica.

INGREDIENTES DE TODAS LAS RECETAS DE LA SEMANA:
${allIngredients.join("\n")}

INSTRUCCIONES:
1. Combina ingredientes iguales sumando cantidades (ej: "200g pechuga de pollo" + "300g pechuga de pollo" = "500g pechuga de pollo")
2. Redondea a cantidades prácticas para comprar (no "347g", sino "350g" o "400g")
3. Agrupa por sección del supermercado
4. Si un ingrediente aparece en forma genérica y específica, unifica (ej: "aceite de oliva" + "aceite de oliva extra virgen" = usar la versión más específica)
5. Incluye condimentos y especias que probablemente no se tengan en casa (no asumas sal y pimienta)

Devuelve UNICAMENTE un JSON válido:
{
  "items": [
    { "name": "Pechuga de pollo", "quantity": "1.5 kg", "category": "Proteinas" },
    { "name": "Brócoli", "quantity": "3 unidades", "category": "Verduras" },
    { "name": "Aguacate", "quantity": "5 unidades", "category": "Frutas" },
    { "name": "Aceite de oliva extra virgen", "quantity": "1 botella", "category": "Condimentos" }
  ]
}

Categorías válidas: Proteinas, Verduras, Frutas, Lácteos, Condimentos, Otros

IMPORTANTE: Devuelve SOLO el JSON, nada más.`;
}
