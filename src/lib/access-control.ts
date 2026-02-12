import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

const CONFIG_DOC = doc(db, "config", "access");

export interface AccessConfig {
  allowedEmails: string[];
  adminEmail: string;
}

/**
 * Check if an email is authorized to use the app.
 * If no config exists yet (first user), creates it and makes them admin.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(CONFIG_DOC);

    if (!snap.exists()) {
      // First user ever - make them admin and allow them
      await setDoc(CONFIG_DOC, {
        allowedEmails: [email.toLowerCase()],
        adminEmail: email.toLowerCase(),
      });
      return true;
    }

    const data = snap.data() as AccessConfig;
    return data.allowedEmails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
  } catch (error) {
    console.error("Error checking access:", error);
    // If we can't check, deny access for safety
    return false;
  }
}

/**
 * Get the full access config (only admin should call this).
 */
export async function getAccessConfig(): Promise<AccessConfig | null> {
  try {
    const snap = await getDoc(CONFIG_DOC);
    if (!snap.exists()) return null;
    return snap.data() as AccessConfig;
  } catch (error) {
    console.error("Error getting access config:", error);
    return null;
  }
}

/**
 * Check if an email is the admin.
 */
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(CONFIG_DOC);
    if (!snap.exists()) return false;
    const data = snap.data() as AccessConfig;
    return data.adminEmail.toLowerCase() === email.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Add an email to the allowed list (admin only).
 */
export async function addAllowedEmail(email: string): Promise<void> {
  await updateDoc(CONFIG_DOC, {
    allowedEmails: arrayUnion(email.toLowerCase()),
  });
}

/**
 * Remove an email from the allowed list (admin only).
 */
export async function removeAllowedEmail(email: string): Promise<void> {
  await updateDoc(CONFIG_DOC, {
    allowedEmails: arrayRemove(email.toLowerCase()),
  });
}
