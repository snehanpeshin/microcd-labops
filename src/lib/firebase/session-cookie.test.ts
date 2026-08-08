import { afterEach, describe, expect, it, vi } from "vitest";
import { firebaseSessionCookie, firebaseSessionCookieOptions } from "@/lib/firebase/session-cookie";

describe("Firebase session cookie", () => {
  afterEach(() => vi.useRealTimers());

  it("uses a short HTTP-only same-site session lifetime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    expect(firebaseSessionCookie).toBe("labops_firebase_session");
    expect(firebaseSessionCookieOptions(expiresAt)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3300,
    });
  });

  it("never extends beyond the Firebase token expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    expect(firebaseSessionCookieOptions(expiresAt).maxAge).toBe(300);
  });
});
