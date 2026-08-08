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
  const registration = await navigator.serviceWorker.register("/firebase-auth-sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update();
  await navigator.serviceWorker.ready;
  return registration;
}

export async function primeAuthServiceWorker(token: string) {
  const registration = await ensureAuthServiceWorker();
  const sendToken = (worker: ServiceWorker | null) => new Promise<boolean>((resolve) => {
    if (!worker) return resolve(false);
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(false), 1200);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve(event.data?.type === "AUTH_TOKEN_READY");
    };
    worker.postMessage({ type: "SET_AUTH_TOKEN", token }, [channel.port2]);
  });

  if (await sendToken(registration.waiting ?? registration.active ?? navigator.serviceWorker.controller)) return;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 3000);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
  const refreshed = await navigator.serviceWorker.getRegistration("/");
  if (!await sendToken(refreshed?.active ?? navigator.serviceWorker.controller)) {
    throw new Error("The authentication session worker could not be updated. Reload and try again.");
  }
}
