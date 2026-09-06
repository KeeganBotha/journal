import "server-only";
import webpush from "web-push";
import { config } from "./config";

// The one place web-push is configured. Callers get a three-way outcome so
// the cron can prune dead subscriptions without knowing HTTP status codes.

// Lazy: web-push validates key format on setVapidDetails, and `next build`
// evaluates this module with CI's dummy env — configure on first send instead.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    config.VAPID_SUBJECT,
    config.VAPID_PUBLIC_KEY,
    config.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url: string };
export type PushOutcome = "sent" | "gone" | "failed";

export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<PushOutcome> {
  try {
    ensureConfigured();
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6 }, // a nightly nudge is stale by morning
    );
    return "sent";
  } catch (error) {
    // 404/410 = the browser revoked the subscription (SPEC rule 6): delete it.
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("sendPush failed:", status, target.endpoint.slice(0, 40));
    return "failed";
  }
}
