import { NextResponse } from "next/server";
import { getFirebaseClaims } from "@/lib/firebase/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const claims = await getFirebaseClaims();
  if (!claims) return NextResponse.json({ authenticated: false }, { status: 401 });

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
  return NextResponse.json({ authenticated: true, hasWorkspace: Boolean(membership.data) });
}
