import { afterEach, describe, expect, it } from "vitest";
import { authCallbackUrl, publicAuthOrigin, safeAuthNext } from "@/lib/auth/redirects";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("email auth redirects", () => {
  it("accepts only local application paths", () => {
    expect(safeAuthNext("/invite/abc")).toBe("/invite/abc");
    expect(safeAuthNext("//attacker.example")).toBe("/onboarding");
    expect(safeAuthNext("/\\attacker.example")).toBe("/onboarding");
    expect(safeAuthNext("https://attacker.example")).toBe("/onboarding");
  });

  it("uses the forwarded production host instead of a stale configured localhost URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    const request = new Request("https://internal-host/auth", {
      headers: {
        "x-forwarded-host": "labops.microcdlabs.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(publicAuthOrigin(request)).toBe("https://labops.microcdlabs.com");
    expect(authCallbackUrl(request, "/onboarding").toString()).toBe(
      "https://labops.microcdlabs.com/auth/callback?next=%2Fonboarding",
    );
  });

  it("falls back to the configured canonical origin for an untrusted host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://labops.microcdlabs.com";
    const request = new Request("https://untrusted.example/auth");
    expect(publicAuthOrigin(request)).toBe("https://labops.microcdlabs.com");
  });
});
