import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Amplify server runtime configuration", () => {
  const config = readFileSync(resolve(process.cwd(), "amplify.yml"), "utf8");

  it.each([
    "NEXT_PUBLIC_",
    "SUPABASE_SERVICE_ROLE_KEY=",
    "RESEND_",
    "LEAD_NOTIFICATION_EMAIL=",
    "EMAIL_PREVIEW_MODE=",
    "CRON_SECRET=",
    "OPENAI_",
    "STRIPE_",
  ])("includes the %s environment allowlist entry", (entry) => {
    expect(config).toContain(entry);
  });
});
