import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAqkiSby_ySVpfp0_TPCW5wd7g1Fpl8UJM",
  authDomain: "recetario-bd58f.firebaseapp.com",
  projectId: "recetario-bd58f",
  storageBucket: "recetario-bd58f.firebasestorage.app",
  messagingSenderId: "600037696024",
  appId: "1:600037696024:web:ff0afd180e9b102cea196d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
