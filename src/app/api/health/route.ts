import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  if (!appConfig.supabaseConfigured) {
    return NextResponse.json({ status: appConfig.demoMode ? "demo" : "degraded", database: "not_configured", version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local", checkedAt }, { status: appConfig.demoMode ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { error } = await createAdminClient().from("organizations").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "reachable", version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local", checkedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable", version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local", checkedAt }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
