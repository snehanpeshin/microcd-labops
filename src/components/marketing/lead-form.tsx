"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function LeadForm() {
  const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Submission is unavailable. Please email info@microcdlabs.com.");
      setState("sent");
      setMessage("Request received. We will reply by email.");
    } catch (cause) {
      setState("error");
      setMessage(cause instanceof Error ? cause.message : "Submission is unavailable. Please email info@microcdlabs.com.");
    }
  }

  return <form action={submit} className="form-grid"><div className="form-field"><label htmlFor="lead-name">Name</label><input id="lead-name" name="name" autoComplete="name" required minLength={2} /></div><div className="form-field"><label htmlFor="lead-email">Work email</label><input id="lead-email" name="email" type="email" autoComplete="email" required /></div><div className="form-field form-field-wide"><label htmlFor="lead-org">Organization</label><input id="lead-org" name="organization" autoComplete="organization" /></div><div className="hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div><div className="form-field form-field-wide"><label htmlFor="lead-message">What should the pilot help you document or trace?</label><textarea id="lead-message" name="message" rows={6} minLength={20} required /></div><div className="form-field-wide flex flex-wrap items-center gap-4"><Button disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Request a pilot discussion"}</Button>{message && <p role={state === "error" ? "alert" : "status"} className={`text-sm font-semibold ${state === "error" ? "text-red-800" : "text-emerald-800"}`}>{message}</p>}</div></form>;
}
