import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { publicAuthOrigin, safeAuthNext } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function failedRedirect(origin: string, code: string, description: string) {
  const target = new URL("/login", origin);
  target.searchParams.set("error", "confirmation_failed");
  target.searchParams.set("error_code", code);
  target.searchParams.set("error_description", description.slice(0, 240));
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeAuthNext(url.searchParams.get("next"));
  const origin = publicAuthOrigin(request);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    return failedRedirect(origin, error.code ?? "confirmation_failed", error.message);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    return failedRedirect(origin, error.code ?? "confirmation_failed", error.message);
  }

  return failedRedirect(
    origin,
    url.searchParams.get("error_code") ?? "confirmation_failed",
    url.searchParams.get("error_description") ?? "This confirmation link is invalid or has expired.",
  );
}
