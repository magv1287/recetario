import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Allow up to 60 seconds for this route (Vercel Hobby plan)
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();

  const parts = rangeStr.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const page = Number(part);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const action = formData.get("action") as string;
    const pagesStr = formData.get("pages") as string | null;

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF requerido" }, { status: 400 });
    }

    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (action === "preview") {
      // Use pdf-parse to get page count
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        return NextResponse.json({
          totalPages: data.numpages,
          fileName: pdfFile.name,
        });
      } catch {
        // Fallback: estimate pages (rough: 3000 chars per page)
        const text = buffer.toString("utf-8");
        const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
        return NextResponse.json({
          totalPages: estimatedPages,
          fileName: pdfFile.name,
        });
      }
    }

    if (action === "extract") {
      // Extract text from PDF
      let pdfText = "";
      let totalPages = 1;

      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        pdfText = data.text;
        totalPages = data.numpages;
      } catch {
        // Fallback to sending the PDF as binary to Gemini
        pdfText = "";
      }

      // If specific pages requested, try to extract just those
      const textToProcess = pdfText;
      let pageInfo = "";

      if (pagesStr && pdfText) {
        const requestedPages = parsePageRanges(pagesStr, totalPages);
        pageInfo = `Solo procesa las recetas de las páginas: ${requestedPages.join(", ")} de un total de ${totalPages} páginas.`;
        // We can't perfectly split by page with pdf-parse, but we tell Gemini
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Try to use PDF as inline data if text extraction failed
      if (!pdfText) {
        const base64 = buffer.toString("base64");
        const result = await model.generateContent([
          `Actúa como un chef experto. Analiza este PDF de recetas.
${pageInfo}

Extrae TODAS las recetas que encuentres.

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "recipes": [
    {
      "title": "Nombre de la receta",
      "description": "Breve descripción de 1-2 frases",
      "category": "Sopas|Carnes|Pescados|Postres|Ensaladas|Pastas|Arroces|Snacks|Desayunos|Otros",
      "diets": ["Keto", "Low Carb", "Carnivora", "Mediterranea"],
      "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
      "steps": ["Paso 1 detallado", "Paso 2 detallado"],
      "imageUrl": ""
    }
  ]
}

Reglas:
- Solo incluye dietas que realmente apliquen
- Los ingredientes deben incluir cantidades
- Los pasos deben ser claros y detallados
- La categoría debe ser exactamente una de las opciones listadas`,
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64,
            },
          },
        ]);

        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        return NextResponse.json(JSON.parse(cleanJson));
      }

      // Use text content with Gemini
      // Limit text to avoid token limits
      const truncatedText = textToProcess.substring(0, 30000);

      const prompt = `Actúa como un chef experto. Analiza el siguiente texto extraído de un PDF de recetas.
${pageInfo}

Texto del PDF:
${truncatedText}

Extrae TODAS las recetas que encuentres.

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "recipes": [
    {
      "title": "Nombre de la receta",
      "description": "Breve descripción de 1-2 frases",
      "category": "Sopas|Carnes|Pescados|Postres|Ensaladas|Pastas|Arroces|Snacks|Desayunos|Otros",
      "diets": ["Keto", "Low Carb", "Carnivora", "Mediterranea"],
      "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
      "steps": ["Paso 1 detallado", "Paso 2 detallado"],
      "imageUrl": ""
    }
  ]
}

Reglas:
- Solo incluye dietas que realmente apliquen a cada receta
- Los ingredientes deben incluir cantidades cuando sea posible
- Los pasos deben ser claros y detallados
- La categoría debe ser exactamente una de las opciones listadas
- Si no encuentras recetas, devuelve {"recipes": []}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      return NextResponse.json(JSON.parse(cleanJson));
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error extracting from PDF:", error);
    return NextResponse.json(
      { error: "Error al procesar el PDF" },
      { status: 500 }
    );
  }
}
