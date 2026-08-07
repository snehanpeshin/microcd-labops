const productionHosts = new Set(["labops.microcdlabs.com"]);

export function safeAuthNext(value: string | null | undefined, fallback = "/onboarding") {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}

export function publicAuthOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost ?? request.headers.get("host")?.split(",")[0]?.trim();
  const hostname = host?.split(":")[0]?.toLowerCase();
  const isTrustedHost = Boolean(
    hostname &&
      (productionHosts.has(hostname) ||
        hostname.endsWith(".amplifyapp.com") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1"),
  );

  if (host && isTrustedHost) {
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = hostname === "localhost" || hostname === "127.0.0.1"
      ? requestUrl.protocol
      : forwardedProtocol === "http" ? "http:" : "https:";
    return `${protocol}//${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  return requestUrl.origin;
}

export function authCallbackUrl(request: Request, next?: string | null) {
  const callback = new URL("/auth/callback", publicAuthOrigin(request));
  callback.searchParams.set("next", safeAuthNext(next));
  return callback;
}
