"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isEmailAllowed } from "@/lib/access-control";

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Check if the user's email is in the allowed list
        const allowed = await isEmailAllowed(firebaseUser.email);
        if (!allowed) {
          // Not authorized - sign them out
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (email) {
        const allowed = await isEmailAllowed(email);
        if (!allowed) {
          await firebaseSignOut(auth);
          throw new Error(
            "Este email no esta autorizado. Contacta al administrador."
          );
        }
      }
    } catch (error: any) {
      if (error.message?.includes("no esta autorizado") || error.message?.includes("not authorized")) {
        throw error;
      }
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Check allowlist BEFORE attempting auth
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        throw new Error(
          "Este email no esta autorizado. Contacta al administrador."
        );
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.message?.includes("no esta autorizado") || error.message?.includes("not authorized")) {
        throw error;
      }
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      // Check allowlist BEFORE attempting sign-up
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        throw new Error(
          "Este email no esta autorizado. Contacta al administrador."
        );
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.message?.includes("no esta autorizado") || error.message?.includes("not authorized")) {
        throw error;
      }
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
