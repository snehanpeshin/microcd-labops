import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.AWS_COMMIT_ID?.slice(0, 12) ?? "local";

export async function GET() {
  const checkedAt = new Date().toISOString();
  if (!appConfig.supabaseConfigured) {
    return NextResponse.json({ status: appConfig.demoMode ? "demo" : "degraded", database: "not_configured", version: buildVersion, checkedAt }, { status: appConfig.demoMode ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { error } = await createAdminClient().from("organizations").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "reachable", version: buildVersion, checkedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable", version: buildVersion, checkedAt }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
