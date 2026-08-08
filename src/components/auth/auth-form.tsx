"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { primeAuthServiceWorker, waitForFirebaseAuth } from "@/lib/firebase/client";

type AuthMode = "login" | "signup" | "forgot" | "resend";

export function AuthForm({ mode, next = "/app" }: { mode: AuthMode; next?: string }) {
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
      const auth = await waitForFirebaseAuth();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const actionSettings = { url: `${window.location.origin}/login?confirmed=1` };
      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user, actionSettings);
          await signOut(auth);
          setCooldown(60);
          setMessage("Verify your email using the newest link we sent, then sign in again.");
          return;
        }
        const token = await credential.user.getIdToken(true);
        await primeAuthServiceWorker(token);
        const session = await fetch("/api/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!session.ok) throw new Error("Your secure session could not be established. Please try again.");
        const state = await session.json() as { hasWorkspace?: boolean };
        window.location.assign(state.hasWorkspace ? next : "/onboarding");
        return;
      }

      if (mode === "signup") {
        const fullName = String(formData.get("fullName") ?? "").trim();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: fullName });
        await sendEmailVerification(credential.user, actionSettings);
        await signOut(auth);
        setCooldown(60);
        setMessage("Check your email to verify the account, then return here to sign in.");
        return;
      }

      if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email, actionSettings);
        setCooldown(60);
        setMessage("If an account exists for that address, a reset link has been sent.");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (credential.user.emailVerified) {
        await signOut(auth);
        setMessage("This account is already verified. Return to sign in.");
        return;
      }
      await sendEmailVerification(credential.user, actionSettings);
      await signOut(auth);
      setCooldown(60);
      setMessage("A new verification link has been sent. Use the newest email.");
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      if (/too-many-requests|quota-exceeded/.test(code)) setCooldown(60);
      const friendlyMessage = code.includes("invalid-credential")
        ? "The email or password is incorrect."
        : code.includes("email-already-in-use")
          ? "An account already exists for this email. Sign in or reset the password."
          : code.includes("weak-password")
            ? "Choose a stronger password that meets the displayed requirements."
            : code.includes("too-many-requests") || code.includes("quota-exceeded")
              ? "Too many email requests. Please wait before trying again."
              : cause instanceof Error
                ? cause.message
                : "The request could not be completed.";
      setError(friendlyMessage);
    }
    finally { setLoading(false); }
  }

  return <form action={submit} className="space-y-4">
    {mode === "signup" && <div className="form-field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" required minLength={2} /></div>}
    <div className="form-field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    {mode !== "forgot" && <div className="form-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={10} /><span className="text-xs text-slate-500">Use at least 10 characters.</span></div>}
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
                : "Resend verification"}
    </Button>
  </form>;
}
