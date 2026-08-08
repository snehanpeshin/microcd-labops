/* Firebase Auth token bridge for authenticated same-origin Next.js requests. */
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBUMoS2nBVKcxH_agGvR7RkV-lIwoc5W3c",
  authDomain: "microcd-labops.firebaseapp.com",
  projectId: "microcd-labops",
  storageBucket: "microcd-labops.firebasestorage.app",
  messagingSenderId: "262642302422",
  appId: "1:262642302422:web:3c176b4cfeb6aaa7103877",
});

let pendingPageToken = null;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SET_AUTH_TOKEN" || typeof event.data.token !== "string") return;
  pendingPageToken = event.data.token;
  event.ports[0]?.postMessage({ type: "AUTH_TOKEN_READY" });
});

function currentIdToken() {
  if (pendingPageToken) {
    const token = pendingPageToken;
    pendingPageToken = null;
    return Promise.resolve(token);
  }
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      unsubscribe();
      if (!user) return resolve(null);
      try {
        resolve(await user.getIdToken());
      } catch {
        resolve(null);
      }
    });
  });
}

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  const needsServerIdentity =
    event.request.mode === "navigate" ||
    requestUrl.pathname.startsWith("/api/") ||
    event.request.headers.has("next-action") ||
    event.request.headers.has("rsc");
  if (
    requestUrl.origin !== self.location.origin ||
    event.request.headers.has("authorization") ||
    !needsServerIdentity
  ) return;

  event.respondWith((async () => {
    const token = await currentIdToken();
    if (!token) return fetch(event.request);
    const headers = new Headers(event.request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(new Request(event.request, { headers }));
  })());
});
