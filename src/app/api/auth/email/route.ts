import { NextResponse } from "next/server";
import { z } from "zod";
import { authCallbackUrl, safeAuthNext } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const EMAIL_COOLDOWN_SECONDS = 60;

function authErrorResponse(error: { code?: string; message: string }) {
  const rateLimited =
    error.code === "over_email_send_rate_limit" ||
    error.code === "email_rate_limit_exceeded" ||
    /rate limit/i.test(error.message);

  if (rateLimited) {
    return NextResponse.json(
      {
        error: "Too many email requests. Please wait before trying again.",
        retryAfter: EMAIL_COOLDOWN_SECONDS,
      },
      {
        status: 429,
        headers: { "Retry-After": String(EMAIL_COOLDOWN_SECONDS) },
      },
    );
  }

  return NextResponse.json({ error: error.message }, { status: 400 });
}

const emailAuthSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("signup"),
    email: z.string().trim().email().max(254),
    password: z.string().min(10).max(256),
    fullName: z.string().trim().min(2).max(120),
    next: z.string().optional(),
  }),
  z.object({
    action: z.literal("resend"),
    email: z.string().trim().email().max(254),
    next: z.string().optional(),
  }),
  z.object({
    action: z.literal("recovery"),
    email: z.string().trim().email().max(254),
  }),
]);

export async function POST(request: Request) {
  const input = emailAuthSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "Enter valid account details and try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const { action, email } = input.data;

  if (action === "signup") {
    const next = safeAuthNext(input.data.next);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.data.password,
      options: {
        data: { full_name: input.data.fullName },
        emailRedirectTo: authCallbackUrl(request, next).toString(),
      },
    });
    if (error) return authErrorResponse(error);
    return NextResponse.json({ ok: true, requiresConfirmation: !data.session });
  }

  if (action === "resend") {
    const next = safeAuthNext(input.data.next);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authCallbackUrl(request, next).toString() },
    });
    if (error) return authErrorResponse(error);
    return NextResponse.json({ ok: true, requiresConfirmation: true });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl(request, "/reset-password").toString(),
  });
  if (error) return authErrorResponse(error);
  return NextResponse.json({ ok: true, requiresConfirmation: true });
}
