import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { syncToBring } from "@/lib/bring";
import { ShoppingList } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { weekId } = await req.json();

    if (!weekId) {
      return NextResponse.json({ error: "weekId requerido" }, { status: 400 });
    }

    const listSnap = await adminDb.collection("shoppingLists").doc(weekId).get();
    if (!listSnap.exists) {
      return NextResponse.json({ error: "Lista de compras no encontrada" }, { status: 404 });
    }

    const shoppingList = listSnap.data() as ShoppingList;

    const uncheckedItems = shoppingList.items.filter((item) => !item.checked);

    if (uncheckedItems.length === 0) {
      return NextResponse.json({ error: "No hay items pendientes para enviar" }, { status: 400 });
    }

    const weekNum = weekId.split("-W")[1]?.replace(/^0/, "") || weekId;
    const listName = `Semana ${weekNum}`;
    const bringListId = await syncToBring(uncheckedItems, listName);

    await adminDb.collection("shoppingLists").doc(weekId).update({
      syncedToBring: true,
      bringListId,
    });

    return NextResponse.json({ success: true, bringListId, itemsSynced: uncheckedItems.length });
  } catch (error: any) {
    console.error("Error syncing to Bring!:", error?.message || error);

    let userError = "Error al sincronizar con Bring!";
    const msg = error?.message || "";
    if (msg.includes("Credenciales")) {
      userError = msg;
    } else if (msg.includes("401") || msg.includes("Unauthorized")) {
      userError = "Credenciales de Bring! invalidas. Verifica BRING_EMAIL y BRING_PASSWORD.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
