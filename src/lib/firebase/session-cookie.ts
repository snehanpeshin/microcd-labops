export const firebaseSessionCookie = "labops_firebase_session";

export function firebaseSessionCookieOptions(expiresAt: number) {
  const secondsRemaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.min(secondsRemaining, 55 * 60),
  };
}
