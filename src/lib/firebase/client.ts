"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { firebaseConfig, firebaseConfigured } from "@/lib/firebase/config";

let persistenceReady: Promise<void> | null = null;

export function getFirebaseAuth() {
  if (!firebaseConfigured) throw new Error("Firebase authentication is not configured");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  persistenceReady ??= setPersistence(auth, browserLocalPersistence);
  return auth;
}

export async function waitForFirebaseAuth() {
  const auth = getFirebaseAuth();
  await persistenceReady;
  await auth.authStateReady();
  return auth;
}

export async function ensureAuthServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support the secure authentication session required by LabOps.");
  }
  const registration = await navigator.serviceWorker.register("/firebase-auth-sw.js", { scope: "/" });
  await registration.update();
  await navigator.serviceWorker.ready;
}
