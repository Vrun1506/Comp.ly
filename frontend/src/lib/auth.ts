// Auth helpers – wrapping Firebase Auth actions

import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import type { User } from "@/types";

/** Sign in with Google popup; creates Firestore user doc on first login (best-effort) */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Best-effort: don't block sign-in if Firestore rules aren't deployed yet
  try {
    const userRef = doc(db, "users", fbUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        photoURL: fbUser.photoURL,
        consultancyId: null,
        role: "owner",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn("signInWithGoogle: Firestore write failed (rules not deployed?)", err);
  }

  return fbUser;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Subscribe to auth state; resolves once with the current user or null */
export function subscribeAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Wait for Firebase auth to finish initializing, then return the current user */
function waitForAuthReady(): Promise<import("firebase/auth").User | null> {
  return new Promise((resolve) => {
    // If already initialized, resolve immediately
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/** Get Firebase ID token for backend API calls.
 *  Waits for auth state to be restored after a full-page redirect. */
export async function getIdToken(): Promise<string | null> {
  // Use currentUser if available (already initialized), otherwise wait
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (!user) return null;
  return user.getIdToken();
}

/** Get Firestore user profile */
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Convert any Firestore Timestamps to ISO strings
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && typeof (v as any).toDate === "function") {
      normalized[k] = (v as any).toDate().toISOString();
    } else {
      normalized[k] = v;
    }
  }
  return normalized as unknown as User;
}
