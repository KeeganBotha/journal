"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { subscribeToReminders, unsubscribeFromReminders } from "../actions";

type Support = "checking" | "unsupported" | "denied" | "ready";

// Client leaf: owns the browser half of web push (permission, service worker,
// PushManager) and hands the resulting subscription to the action. The switch
// reflects THIS browser's state — the server count on the page covers others.
export function ReminderToggle({
  vapidPublicKey,
}: {
  /** From config.ts via the server component — never a NEXT_PUBLIC_ var. */
  vapidPublicKey: string;
}) {
  const id = useId();
  const [support, setSupport] = useState<Support>("checking");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Probe this browser's push support once, off the render path.
    let cancelled = false;
    detectSupport().then(({ support, enabled }) => {
      if (cancelled) return;
      setSupport(support);
      setEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (checked: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (checked) {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setSupport(permission === "denied" ? "denied" : "ready");
            return;
          }
          // Always subscribe fresh. iOS carries a registration across a Home
          // Screen remove + re-add that Apple still accepts but the device no
          // longer delivers (2026-09-07), so reusing it would show "on" and
          // send nothing. Drop it on both sides first.
          const stale = await registration.pushManager.getSubscription();
          if (stale) {
            const endpoint = stale.endpoint;
            await stale.unsubscribe();
            await unsubscribeFromReminders({ endpoint }); // a miss is fine
          }
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
          const result = await subscribeToReminders(subscription.toJSON());
          if (!result.ok) {
            await subscription.unsubscribe();
            setError(result.message);
            return;
          }
          setEnabled(true);
          toast.success("Reminders on for this device");
        } else {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();
            const result = await unsubscribeFromReminders({ endpoint });
            if (!result.ok) setError(result.message);
          }
          setEnabled(false);
          toast.success("Reminders off for this device");
        }
      } catch (caught) {
        console.error(caught);
        setError("Couldn't change reminders in this browser — try again.");
      }
    });
  };

  if (support === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        This browser can&apos;t receive push notifications. On iPhone, add
        Journal to your Home Screen first, then open it from there.
      </p>
    );
  }
  if (support === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications are blocked for this site. Allow them in your browser
        settings, then reload this page.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch
          id={id}
          checked={enabled}
          onCheckedChange={onChange}
          disabled={support === "checking" || pending}
        />
        <Label htmlFor={id}>Remind me at night if I haven&apos;t written</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

async function detectSupport(): Promise<{ support: Support; enabled: boolean }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { support: "unsupported", enabled: false };
  }
  if (Notification.permission === "denied") {
    return { support: "denied", enabled: false };
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return { support: "ready", enabled: subscription !== null };
  } catch {
    return { support: "unsupported", enabled: false };
  }
}

// PushManager wants the VAPID public key as bytes; it travels as base64url.
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
