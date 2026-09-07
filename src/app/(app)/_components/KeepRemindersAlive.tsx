"use client";

import { useEffect } from "react";
import { touchReminderSubscription } from "../settings/actions";

// Renders nothing. Once a day per browser, tells the server "this device
// still holds its push subscription" so the cron's staleness sweep
// (STALE_AFTER_DAYS) never expires an active device. If the server no longer
// knows the subscription, drop the browser-side one too so Settings shows the
// truth. Only rendered inside the signed-in shell — the action needs a session.
const STAMP_KEY = "journal:reminders-touched";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function KeepRemindersAlive() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let cancelled = false;
    (async () => {
      try {
        const last = Number(localStorage.getItem(STAMP_KEY) ?? 0);
        if (Date.now() - last < ONE_DAY_MS) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription || cancelled) return;
        const result = await touchReminderSubscription({ endpoint: subscription.endpoint });
        if (result.ok && !result.data.known) await subscription.unsubscribe();
        if (result.ok) localStorage.setItem(STAMP_KEY, String(Date.now()));
      } catch {
        // Offline, private mode, unsupported: try again on the next open.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
