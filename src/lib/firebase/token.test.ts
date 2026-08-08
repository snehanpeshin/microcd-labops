import { describe, expect, it, vi } from "vitest";
import { decodeFirebaseToken } from "@/lib/firebase/token";

function token(payload: Record<string, unknown>) {
  return ["header", Buffer.from(JSON.stringify(payload)).toString("base64url"), "signature"].join(".");
}

describe("decodeFirebaseToken", () => {
  it("extracts claims from a current token for the configured project", () => {
    vi.setSystemTime(new Date("2026-08-07T12:00:00Z"));
    const claims = decodeFirebaseToken(token({
      sub: "firebase-user-id",
      email: "engineer@example.com",
      name: "Lab Engineer",
      email_verified: true,
      role: "authenticated",
      aud: "microcd-labops",
      iss: "https://securetoken.google.com/microcd-labops",
      exp: Math.floor(Date.parse("2026-08-07T13:00:00Z") / 1000),
    }), "microcd-labops");
    expect(claims).toMatchObject({ sub: "firebase-user-id", emailVerified: true, role: "authenticated" });
    vi.useRealTimers();
  });

  it("rejects expired and wrong-project tokens", () => {
    const base = { sub: "user", aud: "other", iss: "https://securetoken.google.com/other", exp: Math.floor(Date.now() / 1000) + 3600 };
    expect(decodeFirebaseToken(token(base), "microcd-labops")).toBeNull();
    expect(decodeFirebaseToken(token({ ...base, aud: "microcd-labops", iss: "https://securetoken.google.com/microcd-labops", exp: 1 }), "microcd-labops")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(decodeFirebaseToken("not-a-jwt", "microcd-labops")).toBeNull();
  });
});
