import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ name: z.string().min(2).max(100), email: z.string().email().max(254), organization: z.string().max(160).default(""), message: z.string().min(20).max(4000), website: z.string().max(0).optional() });
export async function POST(request: Request) {
  try {
    const input = schema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: "Please check the highlighted form fields." }, { status: 400 });
    if (input.data.website) return NextResponse.json({ received: true });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Pilot requests are temporarily unavailable. Please email info@microcdlabs.com." }, { status: 503 });
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    try {
      const rateLimit = await enforceRateLimit(`${clientAddress}:${input.data.email.toLowerCase()}`, "public_lead", 5, 3600);
      if (!rateLimit.allowed) return NextResponse.json({ error: "Too many requests. Please try again later or email info@microcdlabs.com." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    } catch (cause) {
      // A pilot inquiry should remain available if the auxiliary counter is down.
      // Validation and the hidden honeypot still reject malformed and automated posts.
      console.error("Lead rate limit unavailable", cause instanceof Error ? cause.message : "Unknown rate-limit error");
    }
    const { error } = await createAdminClient().from("leads").insert({ name: input.data.name, email: input.data.email, organization_name: input.data.organization, message: input.data.message });
    if (error) return NextResponse.json({ error: "We could not save this request. Please email info@microcdlabs.com." }, { status: 500 });
    if (process.env.RESEND_API_KEY && process.env.LEAD_NOTIFICATION_EMAIL) {
      const result = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL ?? "MicroCD LabOps <notifications@microcdlabs.com>", to: process.env.LEAD_NOTIFICATION_EMAIL, replyTo: input.data.email, subject: `LabOps request from ${input.data.name}`, text: `Organization: ${input.data.organization || "Not provided"}\n\n${input.data.message}` });
      if (result.error) console.error("Lead notification could not be sent", result.error.name);
    }
    return NextResponse.json({ received: true }, { status: 201 });
  } catch (cause) {
    console.error("Lead request failed", cause instanceof Error ? cause.message : "Unknown server error");
    return NextResponse.json({ error: "Pilot requests are temporarily unavailable. Please email info@microcdlabs.com." }, { status: 500 });
  }
}
