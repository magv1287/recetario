import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Solo caché en memoria (sin IndexedDB). Así el móvil/PWA no se queda con planes o
 * recetas viejos mientras la web ya muestra datos nuevos de Firestore.
 */
function createFirestore() {
  if (typeof window === "undefined") {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestore();
export const auth = getAuth(app);
