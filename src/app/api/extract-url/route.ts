import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    // Fetch the URL content
    let pageContent = "";
    let ogImage = "";

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        },
        signal: AbortSignal.timeout(10000),
      });

      const html = await response.text();

      // Extract og:image
      const ogImageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogImageMatch) {
        ogImage = ogImageMatch[1];
      }

      // Strip HTML tags to get clean text (basic cleanup)
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000); // Limit to 15k chars for Gemini
    } catch {
      // If we can't fetch the URL, send the URL itself to Gemini
      pageContent = `URL: ${url}`;
    }

    // Send to Gemini for extraction
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como un chef experto. Analiza el siguiente contenido de una página web y extrae TODAS las recetas que encuentres.

URL original: ${url}
Contenido de la página:
${pageContent}

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
- Solo incluye dietas que realmente apliquen a la receta
- Los ingredientes deben incluir cantidades cuando sea posible
- Los pasos deben ser claros y detallados
- La categoría debe ser exactamente una de las opciones listadas
- Si no encuentras recetas, devuelve {"recipes": []}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    // Add og:image to first recipe if available
    if (ogImage && data.recipes?.length > 0 && !data.recipes[0].imageUrl) {
      data.recipes[0].imageUrl = ogImage;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error extracting from URL:", error);
    return NextResponse.json(
      { error: "Error al procesar la URL" },
      { status: 500 }
    );
  }
}
