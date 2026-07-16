import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceRateLimit(key: string, action: string, maximum: number, windowSeconds: number) {
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    counter_key: key,
    action_name: action,
    window_seconds: windowSeconds,
    maximum,
  });
  if (error) throw new Error("Rate-limit service is unavailable");
  return { allowed: data === true, retryAfter: data === true ? 0 : windowSeconds };
}
