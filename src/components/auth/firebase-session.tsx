"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { ensureAuthServiceWorker, waitForFirebaseAuth } from "@/lib/firebase/client";
import { firebaseConfigured } from "@/lib/firebase/config";

export function FirebaseSession() {
  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsubscribe = () => {};
    void Promise.all([ensureAuthServiceWorker(), waitForFirebaseAuth()]).then(([, auth]) => {
      unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (!user?.emailVerified) return;
        const token = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
      });
    }).catch(() => {
      // Authentication forms surface actionable setup and browser errors.
    });
    return () => unsubscribe();
  }, []);

  return null;
}
