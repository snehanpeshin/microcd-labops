import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseClaims } from "@/lib/firebase/server";
import { createClient } from "@/lib/supabase/server";

const workspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function POST(request: Request) {
  if (!await getFirebaseClaims()) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const input = workspaceSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Enter a valid workspace name and URL ID." }, { status: 400 });

  const supabase = await createClient();
  const result = await supabase.rpc("create_workspace", {
    workspace_name: input.data.name,
    workspace_slug: input.data.slug,
  });
  if (result.error) {
    const conflict = /already belongs|duplicate|unique/i.test(result.error.message);
    return NextResponse.json(
      { error: conflict ? "This account already has a workspace, or that workspace URL ID is unavailable." : "Workspace setup could not be completed." },
      { status: conflict ? 409 : 500 },
    );
  }
  return NextResponse.json({ created: true, organizationId: result.data });
}
