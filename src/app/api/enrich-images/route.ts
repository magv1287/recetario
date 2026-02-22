import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { searchFoodImage } from "@/lib/images";

export const maxDuration = 30;

const BATCH_SIZE = 5;

export async function POST(req: Request) {
  try {
    const { recipeIds } = await req.json();

    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json({ error: "recipeIds requeridos" }, { status: 400 });
    }

    const batch = recipeIds.slice(0, BATCH_SIZE);
    const results: Record<string, string> = {};

    await Promise.all(
      batch.map(async (id: string) => {
        try {
          const snap = await getDoc(doc(db, "recipes", id));
          if (!snap.exists()) return;

          const data = snap.data();
          if (data.imageUrl) {
            results[id] = data.imageUrl;
            return;
          }

          const imageUrl = await searchFoodImage(data.title || data.category || "food");
          if (imageUrl) {
            await updateDoc(doc(db, "recipes", id), { imageUrl });
            results[id] = imageUrl;
          }
        } catch (err: any) {
          console.error(`Image enrich failed for ${id}:`, err?.message);
        }
      })
    );

    const remaining = recipeIds.slice(BATCH_SIZE);

    return NextResponse.json({
      enriched: results,
      remaining,
      done: remaining.length === 0,
    });
  } catch (error: any) {
    console.error("Enrich error:", error?.message || error);
    return NextResponse.json({ error: "Error al buscar imagenes" }, { status: 500 });
  }
}
