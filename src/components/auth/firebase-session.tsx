"use client";

import { useEffect } from "react";
import { ensureAuthServiceWorker, waitForFirebaseAuth } from "@/lib/firebase/client";
import { firebaseConfigured } from "@/lib/firebase/config";

export function FirebaseSession() {
  useEffect(() => {
    if (!firebaseConfigured) return;
    void Promise.all([ensureAuthServiceWorker(), waitForFirebaseAuth()]).catch(() => {
      // Authentication forms surface actionable setup and browser errors.
    });
  }, []);

  return null;
}
