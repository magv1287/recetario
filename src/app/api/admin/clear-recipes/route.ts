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

    const recipesSnap = await getDocs(collection(db, "recipes"));
    let deleted = 0;

    const batch: Promise<void>[] = [];
    recipesSnap.forEach((docSnap) => {
      batch.push(deleteDoc(doc(db, "recipes", docSnap.id)));
      deleted++;
    });

    await Promise.all(batch);

    return NextResponse.json({
      success: true,
      deleted,
      message: `Se eliminaron ${deleted} recetas`,
    });
  } catch (error: any) {
    console.error("Error clearing recipes:", error?.message || error);
    return NextResponse.json(
      { error: "Error al eliminar las recetas" },
      { status: 500 }
    );
  }
}
