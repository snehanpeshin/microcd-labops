export interface FirebaseClaims {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: string;
  exp: number;
  aud: string;
  iss: string;
}

export function decodeFirebaseToken(token: string, projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID): FirebaseClaims | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
    const exp = Number(payload.exp ?? 0);
    if (
      !projectId ||
      payload.aud !== projectId ||
      payload.iss !== `https://securetoken.google.com/${projectId}` ||
      !payload.sub ||
      exp * 1000 <= Date.now()
    ) return null;

    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? payload.email ?? "User"),
      emailVerified: payload.email_verified === true,
      role: String(payload.role ?? ""),
      exp,
      aud: String(payload.aud),
      iss: String(payload.iss),
    };
  } catch {
    return null;
  }
}
