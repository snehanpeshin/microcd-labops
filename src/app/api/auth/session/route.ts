import { NextResponse } from "next/server";
import { getFirebaseClaims } from "@/lib/firebase/server";
import { firebaseAccessToken } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { firebaseSessionCookie, firebaseSessionCookieOptions } from "@/lib/firebase/session-cookie";

export async function POST() {
  const claims = await getFirebaseClaims();
  const token = await firebaseAccessToken();
  if (!claims || !token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const supabase = await createClient();
  const profile = await supabase.rpc("ensure_current_profile");
  if (profile.error) return NextResponse.json({ authenticated: false }, { status: 401 });

  const membership = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", claims.sub)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (membership.error) {
    return NextResponse.json({ error: "Workspace access could not be checked." }, { status: 500 });
  }
  const response = NextResponse.json({ authenticated: true, hasWorkspace: Boolean(membership.data) });
  response.cookies.set(firebaseSessionCookie, token, firebaseSessionCookieOptions(claims.exp));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(firebaseSessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
