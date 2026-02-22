import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { confirm } = await req.json();

    if (confirm !== "DELETE_ALL_RECIPES") {
      return NextResponse.json(
        { error: "Confirmacion requerida. Enviar { confirm: 'DELETE_ALL_RECIPES' }" },
        { status: 400 }
      );
    }

    const collections = ["recipes", "weeklyPlans", "shoppingLists"];
    const results: Record<string, number> = {};

    for (const col of collections) {
      const snap = await adminDb.collection(col).get();
      let count = 0;
      const batch = adminDb.batch();
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
      });
      if (count > 0) await batch.commit();
      results[col] = count;
    }

    return NextResponse.json({
      success: true,
      deleted: results,
      message: `Eliminados: ${results.recipes} recetas, ${results.weeklyPlans} planes, ${results.shoppingLists} listas`,
    });
  } catch (error: any) {
    console.error("Error clearing data:", error?.message || error);
    return NextResponse.json(
      { error: "Error al eliminar los datos" },
      { status: 500 }
    );
  }
}
