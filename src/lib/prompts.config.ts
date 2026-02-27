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
- FRUTAS: solo berries altas en antioxidantes y bajas en azúcar. Permitidas en DESAYUNO y ALMUERZO (no en cena). Cantidad moderada: un puñado (~1/4 taza por persona).
  * Permitidas: arándanos (blueberries), frambuesas (raspberries), fresas (strawberries), moras (blackberries), limón/lima
  * Uso ideal: topping en desayunos (sobre huevos, omelette, o al lado), en ensaladas del almuerzo, o como snack post-almuerzo
  * NO frutas en cena (aguacate sí permitido siempre, no cuenta como fruta)
  * PROHIBIDAS: banano, mango, piña, uvas, sandía, melón, naranja y cualquier fruta alta en azúcar
- PROHIBIDO: cordero, chía, queso azul (o similares), queso de cabra, azúcar, miel, agave, harinas, pan, pasta, arroz, papa, batata, yuca, maíz, cereales, avena, legumbres, zanahoria, remolacha, calabaza, guisantes, aceites vegetales/semillas, margarina, alimentos ultraprocesados
- Priorizar alimentos reales, antiinflamatorios, sin procesados
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE VARIEDAD
// Cómo quieres que Gemini varíe las recetas durante la semana
// ------------------------------------------------------------
export const VARIETY_RULES = `
- Mezcla 5+ perfiles de sabor durante la semana: asiático (sésamo, soja, jengibre), mediterráneo (oliva, limón, hierbas), mexicano (comino, cilantro, chile), peruano (ají, limón), indio (curry, cúrcuma), francés (mostaza, estragón), etc.
- La variedad viene de las SALSAS y ACOMPAÑAMIENTOS, no de cocinar proteínas diferentes cada día
- Elegir 3-4 proteínas base para la semana. Cada una aparece en 2-4 comidas con sabores diferentes
- No repetir perfil de sabor dos días seguidos (misma proteína OK si la salsa/preparación es totalmente diferente)
- Incluir aguacate en algunos desayunos pero no todos (máx 5-6 por semana para 2 personas)
`.trim();

// ------------------------------------------------------------
// INSTRUCCIONES DE PREPARACIÓN
// Cómo quieres que se escriban los pasos e ingredientes
// ------------------------------------------------------------
export const COOKING_INSTRUCTIONS = `
- PASOS: 4-6 pasos claros y detallados. Cada paso debe explicar:
  * QUÉ hacer exactamente (cortar, sazonar, sellar, hornear, etc.)
  * CÓMO hacerlo (en cubos de 2cm, a fuego medio-alto, con tapa, etc.)
  * CUÁNTO tiempo (saltear 3-4 minutos, hornear 20 min, reposar 5 min)
  * CUÁNDO está listo (hasta dorar, hasta que suelte jugo claro, hasta que esté crujiente por fuera)
  * Temperaturas exactas del horno/sartén cuando aplique (400°F/200°C, fuego medio-alto)
  Ejemplo de buen paso: "Calienta 2 cucharadas de aceite de oliva extra virgen en una sartén grande a fuego medio-alto. Cuando el aceite brille, coloca las tiras de pollo sin amontonar. Cocina 3-4 minutos por lado sin mover, hasta que estén doradas y el centro ya no esté rosado."
  Ejemplo de MAL paso: "Cocina el pollo en una sartén." (demasiado vago)
- BATCH COOKING: Si la receta es para meal prep, incluir como PRIMER paso: "PREP DOMINGO:" y explicar qué se cocina el domingo. Luego como ÚLTIMO paso: "ENTRE SEMANA:" y explicar cómo recalentar/servir (ej: "Recalentar en microondas 2 min o en sartén a fuego medio 3-4 min. Servir con aguacate fresco en rodajas.")
- ALMACENAMIENTO: Indicar siempre cómo guardar (contenedor hermético en nevera, dura X días)
- INGREDIENTES: cantidades exactas mostrando SIEMPRE ambas unidades: libras y gramos/kg juntos. Ejemplos: "0.5 lb (227g) pollo", "1.1 lb (500g) res", "3.3 lb (1.5 kg) salmón", "30g (1 oz) queso". Siempre especificar "aceite de oliva extra virgen" o "aceite de coco", nunca solo "aceite". Indicar la preparación del ingrediente: "en cubos", "en rodajas finas", "picado", "desmenuzado", etc.
- DESCRIPCION: 1-2 frases apetitosas. Si es meal prep, mencionar que se prepara el domingo.
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
export const AI_ROLE = `Crea un plan de comidas para 7 dias (desayuno, almuerzo, cena) optimizado para BATCH COOKING / MEAL PREP dominical. MUY IMPORTANTE: las cantidades de TODOS los ingredientes deben ser el TOTAL para el número de porciones indicado, NO por persona.

FILOSOFÍA BATCH COOKING:
- Todo se cocina el DOMINGO. Entre semana solo recalentar (microondas, sartén 5 min) o comer frío.
- REGLA CLAVE DE PROTEÍNAS: Agrupar la semana por proteína base. Cocinar cada proteína UNA sola vez en gran cantidad el domingo y usarla en VARIAS recetas con diferente sabor/salsa/acompañamiento. Ejemplo:
  * Domingo: hornear 3 lb de muslo de pollo con sal y pimienta → Lunes almuerzo: pollo con salsa asiática de sésamo + brócoli. Martes almuerzo: pollo deshebrado con pesto y espinaca. Miércoles cena: pollo en ensalada César con parmesano.
  * Domingo: sellar 2.5 lb de flank steak → Jueves almuerzo: res en fajitas con pimiento. Viernes almuerzo: res con chimichurri y espárragos.
  * Domingo: hornear 2 lb de salmón → Sábado: salmón frío con aguacate y pepino.
- Usar 3-4 proteínas base por semana máximo (para no cocinar 7 cosas distintas). Cada proteína aparece en 2-4 comidas.
- Los desayunos deben ser especialmente rápidos: huevos revueltos (5 min), omelettes, o cosas pre-preparadas el domingo (egg muffins, frittata cortada en porciones)
- Máximo 1-2 recetas por semana que requieran cocinar en el momento (ej: huevos frescos, un pescado del día)
- Priorizar recetas que se mantienen bien en la nevera 4-5 días
- Sé creativo con las SALSAS y ACOMPAÑAMIENTOS para que la misma proteína no sepa igual dos días seguidos`;

// ------------------------------------------------------------
// ROL PARA SWAP (cambiar una receta individual)
// ------------------------------------------------------------
export const AI_SWAP_ROLE = `Genera UNA receta alternativa, diferente en sabor y cocina a las listadas. Prioriza recetas que se puedan preparar con anticipación (meal prep/batch cooking) y recalentar entre semana.`;
