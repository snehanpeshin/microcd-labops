"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InviteMemberForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setState("sending");
    const response = await fetch("/api/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "") }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error ?? "Invitation could not be sent"); setState("error"); return; }
    setMessage("Invitation sent. It expires in 72 hours."); setState("sent");
  }
  return <form action={submit} className="form-grid"><div className="form-field"><label htmlFor="invite-email">Email</label><input id="invite-email" name="email" type="email" required /></div><div className="form-field"><label htmlFor="invite-role">Role</label><select id="invite-role" name="role" defaultValue="engineer"><option value="admin">Admin</option><option value="engineer">Engineer</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option></select></div><div className="form-field-wide flex items-center gap-3"><Button disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send invitation"}</Button>{state === "sent" && <p role="status" className="text-sm text-emerald-800">{message}</p>}{state === "error" && <p role="alert" className="text-sm text-red-800">{message}</p>}</div></form>;
}
