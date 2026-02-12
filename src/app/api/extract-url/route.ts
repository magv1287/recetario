import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Allow up to 60 seconds for this route (Vercel Hobby plan)
export const maxDuration = 60;

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
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Extract og:image (try both property and name attributes)
      const ogImageMatch =
        html.match(
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
        ) ||
        html.match(
          /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
        );
      if (ogImageMatch) {
        ogImage = ogImageMatch[1];
      }

      // Strip HTML tags to get clean text (aggressive cleanup)
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 25000); // Increased limit for pages with many recipes
    } catch (fetchErr: any) {
      console.error("Fetch error:", fetchErr?.message);
      // If we can't fetch the URL, tell Gemini to try to use the URL directly
      pageContent = `No se pudo acceder a la URL directamente. La URL es: ${url}. Por favor, intenta inferir el contenido basándote en la URL.`;
    }

    // Send to Gemini for extraction
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    });

    const prompt = `Actúa como un chef experto. Analiza el siguiente contenido de una página web y extrae TODAS las recetas que encuentres.

URL original: ${url}
Contenido de la página:
${pageContent}

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin backticks, sin explicaciones) con esta estructura exacta:
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

Reglas importantes:
- SOLO devuelve JSON puro, nada más
- Solo incluye dietas que realmente apliquen a la receta
- Los ingredientes deben incluir cantidades cuando sea posible
- Los pasos deben ser claros y detallados
- La categoría debe ser exactamente una de las opciones listadas
- Si no encuentras recetas, devuelve {"recipes": []}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // More robust JSON cleaning
    let cleanJson = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Try to find JSON object if there's extra text around it
    const jsonStart = cleanJson.indexOf("{");
    const jsonEnd = cleanJson.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    }

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error(
        "JSON parse error. Raw response:",
        responseText.substring(0, 500)
      );
      return NextResponse.json(
        { error: "La IA no pudo estructurar las recetas. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!data.recipes || !Array.isArray(data.recipes)) {
      data = { recipes: [] };
    }

    // Add og:image to first recipe if available
    if (ogImage && data.recipes.length > 0 && !data.recipes[0].imageUrl) {
      data.recipes[0].imageUrl = ogImage;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error extracting from URL:", error?.message || error);
    
    const message = error?.message || "";
    let userError = "Error al procesar la URL. Verifica que sea válida e intenta de nuevo.";
    
    if (message.includes("timeout") || message.includes("abort")) {
      userError = "La página tardó demasiado en responder. Intenta de nuevo.";
    } else if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
      userError = "Límite de uso de IA alcanzado. Espera un minuto e intenta de nuevo.";
    } else if (message.includes("404") || message.includes("not found for API")) {
      userError = "Error de configuración del servicio de IA. Contacta al administrador.";
    }
    
    return NextResponse.json(
      { error: userError },
      { status: 500 }
    );
  }
}
