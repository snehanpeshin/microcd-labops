"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AlertCircle } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

type AuthIssue = { code: string; description: string } | null;

export function AuthErrorNotice({ initialCode, initialDescription }: { initialCode?: string; initialDescription?: string }) {
  const hash = useSyncExternalStore(
    () => () => undefined,
    () => window.location.hash,
    () => "",
  );
  const issue = useMemo<AuthIssue>(() => {
    const fragment = new URLSearchParams(hash.replace(/^#/, ""));
    const code = fragment.get("error_code") ?? initialCode;
    const description = fragment.get("error_description") ?? initialDescription;
    return code || description
      ? { code: code ?? "confirmation_failed", description: description ?? "The confirmation link could not be used." }
      : null;
  }, [hash, initialCode, initialDescription]);

  useEffect(() => {
    if (hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [hash]);

  if (!issue) return null;

  const expired = issue.code === "otp_expired" || /expired|invalid/i.test(issue.description);

  return (
    <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4" aria-labelledby="confirmation-error-title">
      <div className="flex gap-3 text-amber-950">
        <AlertCircle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
        <div>
          <h2 id="confirmation-error-title" className="font-semibold">{expired ? "Confirmation link expired" : "Email confirmation failed"}</h2>
          <p className="mt-1 text-sm leading-6">{expired ? "Request a fresh link below and use only the newest confirmation email." : issue.description}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-amber-200 pt-4">
        <AuthForm mode="resend" />
      </div>
    </section>
  );
}
