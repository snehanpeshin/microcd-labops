"use client";

import { createBrowserClient } from "@supabase/ssr";
import { waitForFirebaseAuth } from "@/lib/firebase/client";
import { firebaseConfigured } from "@/lib/firebase/config";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createBrowserClient(url, key, firebaseConfigured ? {
    accessToken: async () => {
      const auth = await waitForFirebaseAuth();
      return auth.currentUser?.getIdToken() ?? null;
    },
  } : undefined);
}
