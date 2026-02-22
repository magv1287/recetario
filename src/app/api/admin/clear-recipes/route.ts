import { NextResponse } from "next/server";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
      const snap = await getDocs(collection(db, col));
      let count = 0;
      const deletes: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        deletes.push(deleteDoc(doc(db, col, docSnap.id)));
        count++;
      });
      await Promise.all(deletes);
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
