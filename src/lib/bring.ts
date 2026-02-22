import Bring from "bring-shopping";
import { ShoppingItem } from "./types";

let bringInstance: InstanceType<typeof Bring> | null = null;
let loggedIn = false;

async function getBring(): Promise<InstanceType<typeof Bring>> {
  const email = process.env.BRING_EMAIL;
  const password = process.env.BRING_PASSWORD;

  if (!email || !password) {
    throw new Error("Credenciales de Bring! no configuradas (BRING_EMAIL, BRING_PASSWORD)");
  }

  if (!bringInstance || !loggedIn) {
    bringInstance = new Bring({ mail: email, password });
    await bringInstance.login();
    loggedIn = true;
  }

  return bringInstance;
}

export async function syncToBring(items: ShoppingItem[], listName: string): Promise<string> {
  const bring = await getBring();

  const lists = await bring.loadLists();
  const allLists = lists.lists || [];

  if (allLists.length === 0) {
    throw new Error("No se encontró ninguna lista en Bring!. Crea una lista primero en la app.");
  }

  const targetList = allLists[0];
  const listUuid = targetList.listUuid;

  const currentItems = await bring.getItems(listUuid);
  if (currentItems?.purchase) {
    for (const existingItem of currentItems.purchase) {
      try {
        await bring.removeItem(listUuid, existingItem.name);
      } catch {
        // skip
      }
    }
  }

  try {
    await bring.saveItem(listUuid, `🗓️ ${listName}`, "---");
  } catch {
    // non-critical
  }

  for (const item of items) {
    if (item.name) {
      try {
        await bring.saveItem(listUuid, item.name, item.quantity || "");
      } catch (err) {
        console.error(`Error adding item "${item.name}" to Bring!:`, err);
      }
    }
  }

  return listUuid;
}
