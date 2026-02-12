import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Allow up to 60 seconds for this route (Vercel Hobby plan)
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Imagen requerida" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // Send to Gemini Vision
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Actúa como un chef experto. Analiza esta imagen que contiene una receta (puede ser un screenshot de Instagram, TikTok, un libro de cocina, o una foto de una receta).

Extrae TODA la información de la receta que puedas encontrar en la imagen.

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
- Si la imagen contiene múltiples recetas, extrae todas
- Solo incluye dietas que realmente apliquen
- Los ingredientes deben incluir cantidades cuando sea posible
- Los pasos deben ser claros y detallados
- La categoría debe ser exactamente una de las opciones listadas
- Si la información está incompleta, infiere lo que puedas de forma razonable
- Si no puedes identificar una receta, devuelve {"recipes": []}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error extracting from image:", error?.message || error);
    
    const message = error?.message || "";
    let userError = "Error al procesar la imagen.";
    
    if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
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
