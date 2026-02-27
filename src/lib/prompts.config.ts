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
- Proteínas: 0.5 lb (227g) de proteína pesada en crudo POR PERSONA por comida (o 3-4 huevos POR PERSONA). Multiplicar siempre por el número de porciones. Especificar SIEMPRE el corte exacto para encontrarlo en el supermercado:
  * Pollo: pechuga (chicken breast), muslo (chicken thigh), muslo deshuesado (boneless thigh)
  * Res: lomo/sirloin (sirloin steak), falda (flank steak), rib eye, ground beef (80/20), chuck roast
  * Cerdo: lomo (pork tenderloin), chuleta (pork chop), costilla (pork ribs), bacon/tocino
  * Pescado: salmón (salmon fillet), tilapia, bacalao (cod), atún (tuna steak), mahi-mahi
  * Mariscos: camarones (shrimp), vieiras (scallops)
  * Otros: pavo molido (ground turkey)
- Carbohidratos: máximo 0.02lb netos por comida por persona (multiplicar por número de porciones)
- ACEITES: SOLO aceite de oliva extra virgen o aceite de coco. PROHIBIDO cualquier aceite vegetal (canola, girasol, soja, maíz, cártamo)
- MANTEQUILLA: siempre con sal
- AGUACATE: buena grasa pero con moderación. Máximo 5-6 aguacates por semana para 2 personas. No poner aguacate en TODAS las comidas, alternar con otras grasas saludables.
- Grasas saludables: aceite de oliva extra virgen, aceite de coco, aguacate, frutos secos, mantequilla con sal, beef tallow, queso, crema
- VERDURAS: SOLO las de muy bajo índice glucémico (IG) y baja carga glucémica. Objetivo: minimizar respuesta de insulina para favorecer pérdida de peso.
  * PERMITIDAS (IG bajo, mínimo impacto en insulina): espinaca, kale, rúcula (arugula), bok choy, apio (celery), pepino (cucumber), rábano (radish), champiñones (mushrooms), brócoli, coliflor, espárragos, calabacín (zucchini), lechuga
  * CON MODERACIÓN (IG medio-bajo, usar cantidades pequeñas): pimiento (bell pepper), berenjena (eggplant), tomate (solo como condimento, no como base), cebolla (solo para sofrito, cantidades pequeñas)
  * PROHIBIDAS (IG alto, elevan insulina): zanahoria, remolacha/betabel, calabaza/squash, maíz/elote, guisantes/arvejas, papa/batata/yuca, cualquier tubérculo
- DISPONIBILIDAD: usar ingredientes fáciles de encontrar en supermercados de Massachusetts (Trader Joe's, Stop & Shop, Whole Foods). Priorizar productos de Trader Joe's y Stop & Shop
- IMPORTANTE Frutas SOLO en almuerzo y limitadas: Limon/Lima, fresas, arándanos, frambuesas
- NO frutas en desayuno ni cena (aguacate sí permitido siempre)
- PROHIBIDO: cordero, chía, queso azul (o similares), queso de cabra, azúcar, miel, agave, harinas, pan, pasta, arroz, papa, batata, yuca, maíz, cereales, avena, legumbres, zanahoria, remolacha, calabaza, guisantes, aceites vegetales/semillas, margarina, alimentos ultraprocesados
- Priorizar alimentos reales, antiinflamatorios, sin procesados
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE VARIEDAD
// Cómo quieres que Gemini varíe las recetas durante la semana
// ------------------------------------------------------------
export const VARIETY_RULES = `
- Mezcla 5+ cocinas: mexicana, asiática, mediterránea, peruana, francesa, india, etc.
- No repetir perfil de sabor dos dias seguidos
- Alternar proteínas: pollo (max 2/semana), res, cerdo, pescado, salmón, camarones, pavo, huevos
- Variar técnicas: plancha, horno, salteado, parrilla, estofado
- Incluir aguacate en algunos desayunos pero no todos (máx 5-6 por semana para 2 personas)
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE PREPARACIÓN
// Cómo quieres que se escriban los pasos e ingredientes
// ------------------------------------------------------------
export const COOKING_INSTRUCTIONS = `
- PASOS: 5-7 pasos claros y detallados. Cada paso debe explicar:
  * QUÉ hacer exactamente (cortar, sazonar, sellar, hornear, etc.)
  * CÓMO hacerlo (en cubos de 2cm, a fuego medio-alto, con tapa, etc.)
  * CUÁNTO tiempo (saltear 3-4 minutos, hornear 20 min, reposar 5 min)
  * CUÁNDO está listo (hasta dorar, hasta que suelte jugo claro, hasta que esté crujiente por fuera)
  * Temperaturas exactas del horno/sartén cuando aplique (400°F/200°C, fuego medio-alto)
  Ejemplo de buen paso: "Calienta 2 cucharadas de aceite de oliva extra virgen en una sartén grande a fuego medio-alto. Cuando el aceite brille, coloca las tiras de pollo sin amontonar. Cocina 3-4 minutos por lado sin mover, hasta que estén doradas y el centro ya no esté rosado."
  Ejemplo de MAL paso: "Cocina el pollo en una sartén." (demasiado vago)
- INGREDIENTES: cantidades exactas mostrando SIEMPRE ambas unidades: libras y gramos/kg juntos. Ejemplos: "0.5 lb (227g) pollo", "1.1 lb (500g) res", "3.3 lb (1.5 kg) salmón", "30g (1 oz) queso". Siempre especificar "aceite de oliva extra virgen" o "aceite de coco", nunca solo "aceite". Indicar la preparación del ingrediente: "en cubos", "en rodajas finas", "picado", "desmenuzado", etc.
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
7. UNIDADES: mostrar SIEMPRE ambas unidades juntas. Ejemplos: "3.3 lb (1.5 kg)", "0.5 lb (227g)", "30g (1 oz)". NUNCA mostrar solo una unidad
8. SINÓNIMOS: unificar ingredientes que son lo mismo bajo UN solo nombre. Ejemplos: bacon ahumado = tocino ahumado (usar solo "Bacon/Tocino ahumado"), cilantro = coriander, calabacín = zucchini, pimiento = bell pepper. NUNCA listar el mismo ingrediente dos veces con nombres diferentes
9. Usar nombres de productos fáciles de encontrar en Trader Joe's, Stop & Shop o Whole Foods de Massachusetts
`.trim();

// ------------------------------------------------------------
// ROL / PERSONALIDAD DE GEMINI
// Cómo quieres que Gemini se comporte
// ------------------------------------------------------------
export const AI_ROLE = `Crea un plan de comidas para 7 dias (desayuno, almuerzo, cena). Sé un chef experto creativo con cocina internacional pero con recetas sencillas y rapidas. MUY IMPORTANTE: las cantidades de TODOS los ingredientes deben ser el TOTAL para el número de porciones indicado, NO por persona.`;

// ------------------------------------------------------------
// ROL PARA SWAP (cambiar una receta individual)
// ------------------------------------------------------------
export const AI_SWAP_ROLE = `Genera UNA receta alternativa, diferente en sabor y cocina a las listadas.`;
