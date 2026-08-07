"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot" | "resend";

export function AuthForm({ mode, next = "/app" }: { mode: AuthMode; next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(formData: FormData) {
    setLoading(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        router.push(next); router.refresh();
      } else {
        const action = mode === "signup" ? "signup" : mode === "forgot" ? "recovery" : "resend";
        const response = await fetch("/api/auth/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            email,
            password: mode === "signup" ? password : undefined,
            fullName: mode === "signup" ? String(formData.get("fullName") ?? "").trim() : undefined,
            next: mode === "signup" ? (next === "/app" ? "/onboarding" : next) : "/onboarding",
          }),
        });
        const result = await response.json().catch(() => ({})) as {
          error?: string;
          requiresConfirmation?: boolean;
          retryAfter?: number;
        };
        if (!response.ok) {
          if (response.status === 429) setCooldown(result.retryAfter ?? 60);
          throw new Error(result.error ?? "The email request could not be completed.");
        }
        setCooldown(60);
        if (mode === "signup" && result.requiresConfirmation === false) {
          router.push(next === "/app" ? "/onboarding" : next);
          router.refresh();
          return;
        }
        setMessage(mode === "signup"
          ? "Check your email to confirm the account, then return to set up your workspace."
          : mode === "forgot"
            ? "If an account exists for that address, a reset link has been sent."
            : "A new confirmation link has been sent. Use the newest email; earlier links may no longer work.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The request could not be completed."); }
    finally { setLoading(false); }
  }

  return <form action={submit} className="space-y-4">
    {mode === "signup" && <div className="form-field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" required minLength={2} /></div>}
    <div className="form-field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    {mode !== "forgot" && mode !== "resend" && <div className="form-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={10} /><span className="text-xs text-slate-500">Use at least 10 characters.</span></div>}
    {mode === "signup" && <label className="flex items-start gap-3 text-xs font-normal leading-5 text-slate-600"><input name="terms" type="checkbox" required className="mt-0.5 size-4 min-h-0" />I agree to the Terms of Use and acknowledge the Privacy Policy. Do not enter patient or regulated production data during evaluation.</label>}
    {error && <p role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
    {message && <p role="status" className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{message}</p>}
    <Button disabled={loading || cooldown > 0} className="w-full">
      {loading
        ? "Working…"
        : cooldown > 0
          ? `Try again in ${cooldown}s`
          : mode === "login"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Resend confirmation"}
    </Button>
  </form>;
}
