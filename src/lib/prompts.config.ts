// ============================================================
// ARCHIVO EDITABLE - Aquí controlas lo que le dices a Gemini
// Edita cualquier sección y pide push a git cuando estés listo
// ============================================================

// ------------------------------------------------------------
// REGLAS DE DIETA
// Estas reglas se aplican a TODAS las recetas generadas
// (plan semanal, swap de recetas individuales)
// ------------------------------------------------------------
export const DIET_RULES = `
DIETA ANTI-INFLAMATORIA (basada en recomendaciones del Dr. Guillermo Navarrete y Dr. Bayter):
- Proteínas: 0.5 lb de proteína pesada en crudo por comida (pollo, res, cerdo, pescado, mariscos, huevos, cordero, pavo) o 3-4 huevos
- Carbohidratos: máximo 0.02lb netos por comida
- ACEITES: SOLO aceite de oliva extra virgen o aceite de coco. PROHIBIDO cualquier aceite vegetal (canola, girasol, soja, maíz, cártamo)
- MANTEQUILLA: siempre con sal
- AGUACATE: usar generosamente en las comidas. Es la grasa estrella.
- Grasas saludables: aceite de oliva extra virgen, aceite de coco, aguacate, frutos secos, mantequilla con sal, beef tallow, queso, crema
- Verduras solo de bajo IG: brócoli, espinaca, coliflor, calabacín, espárragos, champiñones, pimiento, kale, bok choy, berenjena, apio, pepino, rúcula, rábano
- Frutas SOLO en almuerzo y limitadas: fresas, arándanos, frambuesas
- NO frutas en desayuno ni cena (aguacate sí permitido siempre)
- PROHIBIDO: queso azul (o similares), queso de cabra, azúcar, miel, agave, harinas, pan, pasta, arroz, papa, maíz, cereales, avena, legumbres, aceites vegetales/semillas, margarina, alimentos ultraprocesados
- Priorizar alimentos reales, antiinflamatorios, sin procesados
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE VARIEDAD
// Cómo quieres que Gemini varíe las recetas durante la semana
// ------------------------------------------------------------
export const VARIETY_RULES = `
- Mezcla 5+ cocinas: mexicana, asiática, mediterránea, peruana, francesa, india, etc.
- No repetir perfil de sabor dos dias seguidos
- Alternar proteínas: pollo (max 2/semana), res, cerdo, pescado, salmón, camarones, pavo, huevos, cordero
- Variar técnicas: plancha, horno, salteado, parrilla, estofado
- Incluir aguacate de forma creativa en la mayoría de los desayunos (guacamole, rodajas, relleno, salsa, aderezo)
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE PREPARACIÓN
// Cómo quieres que se escriban los pasos e ingredientes
// ------------------------------------------------------------
export const COOKING_INSTRUCTIONS = `
- PASOS: 4-6 pasos detallados con temperaturas, tiempos y señales visuales
- INGREDIENTES: cantidades exactas (gramos, cucharadas, unidades). Siempre especificar "aceite de oliva extra virgen" o "aceite de coco", nunca solo "aceite"
- DESCRIPCION: 1-2 frases apetitosas
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES PARA LISTA DE COMPRAS
// Cómo quieres que se genere la lista de compras
// ------------------------------------------------------------
export const SHOPPING_LIST_RULES = `
1. Suma cantidades iguales (0.44 lb pollo + 0.66 lb pollo = 1.10 lb)
2. Redondea a cantidades prácticas
3. Agrupa por sección del supermercado
4. Unifica genéricos y específicos
5. Si aparece "aceite" sin especificar, siempre poner "Aceite de oliva extra virgen"
6. Asegurarse de incluir suficientes aguacates (sumar todos los que aparezcan)
`.trim();

// ------------------------------------------------------------
// ROL / PERSONALIDAD DE GEMINI
// Cómo quieres que Gemini se comporte
// ------------------------------------------------------------
export const AI_ROLE = `Crea un plan de comidas para 7 dias (desayuno, almuerzo, cena). Sé un chef experto creativo con cocina internacional pero con recetas sencillas y rapidas.`;

// ------------------------------------------------------------
// ROL PARA SWAP (cambiar una receta individual)
// ------------------------------------------------------------
export const AI_SWAP_ROLE = `Genera UNA receta alternativa, diferente en sabor y cocina a las listadas.`;
