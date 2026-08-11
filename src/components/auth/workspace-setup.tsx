"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function WorkspaceSetup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(formData: FormData) {
    setLoading(true); setError("");
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error: rpcError } = await createClient().rpc("create_workspace", { workspace_name: name, workspace_slug: slug });
    if (rpcError) { setError(rpcError.message); setLoading(false); return; }
    router.push("/app"); router.refresh();
  }
  return <form action={submit} className="space-y-4"><div className="form-field"><label htmlFor="name">Organization name</label><input id="name" name="name" required minLength={2} /></div><div className="form-field"><label htmlFor="slug">Workspace URL ID</label><input id="slug" name="slug" required pattern="[a-z0-9-]+" placeholder="your-lab" /><span className="text-xs text-slate-500">Lowercase letters, numbers, and hyphens.</span></div>{error && <p role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} />{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "Creating workspace…" : "Create workspace"}</Button></form>;
}
