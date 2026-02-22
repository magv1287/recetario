import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App;
let _adminDb: Firestore;
let _initError: string | null = null;

try {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      _initError = "FIREBASE_SERVICE_ACCOUNT_KEY no está configurada. Agrégala en las variables de entorno.";
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      const parsed = JSON.parse(serviceAccount);
      app = initializeApp({
        credential: cert(parsed),
      });
    }
  } else {
    app = getApps()[0];
  }
  _adminDb = getFirestore(app!);
} catch (e: any) {
  _initError = `Error inicializando Firebase Admin: ${e?.message || e}`;
  console.error(_initError);
}

export const adminDb = _adminDb!;

export function checkAdminReady(): string | null {
  return _initError;
}
