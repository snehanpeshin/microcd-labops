import { createAdminClient } from "@/lib/supabase/admin";

export interface OperationalEvent {
  correlationId: string;
  category: string;
  severity: "info" | "warning" | "error";
  code: string;
  safeMessage: string;
  organizationId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function correlationId(value?: string | null) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : crypto.randomUUID();
}

export async function recordOperationalEvent(event: OperationalEvent) {
  const payload = {
    correlation_id: event.correlationId,
    organization_id: event.organizationId ?? null,
    category: event.category,
    severity: event.severity,
    code: event.code,
    safe_message: event.safeMessage,
    metadata: event.metadata ?? {},
  };
  console[event.severity === "error" ? "error" : event.severity === "warning" ? "warn" : "info"](JSON.stringify({ event: "labops_operational", ...payload }));
  try {
    await createAdminClient().from("operational_events").insert(payload);
  } catch {
    // Logging must never hide the originating failure.
  }
}
