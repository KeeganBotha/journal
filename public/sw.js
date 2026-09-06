// Service worker: receives web push and shows it; taps open the app.
// Deliberately tiny — no caching/offline in v1 (SPEC scope).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "Journal", body: "You haven't written today.", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON payload: keep the defaults.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "journal-reminder", // one reminder at a time — a new one replaces the old
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.focus().then((c) => c.navigate?.(url) ?? c);
      return self.clients.openWindow(url);
    }),
  );
});
