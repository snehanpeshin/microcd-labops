import { firebaseAccessToken } from "@/lib/supabase/server";
import { decodeFirebaseToken } from "@/lib/firebase/token";

export async function getFirebaseClaims() {
  const token = await firebaseAccessToken();
  return token ? decodeFirebaseToken(token) : null;
}
