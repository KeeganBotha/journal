import "server-only";
import { verifySession } from "@/lib/server/session";
import * as remindersProvider from "./reminders.provider";
import type { PushSubscriptionInput } from "./reminders.schemas";

// Business logic layer. Every function verifies the session as its FIRST
// statement and never accepts identity from the caller (PATTERNS.md §2).

/** How many devices this user has reminders on (the settings page's status line). */
export async function getReminderDeviceCount(): Promise<number> {
  const scope = await verifySession();
  return remindersProvider.countSubscriptions(scope);
}

export async function enableReminders(
  subscription: PushSubscriptionInput,
): Promise<void> {
  const scope = await verifySession();
  await remindersProvider.upsertSubscription(scope, {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
}

/** Returns false when no such subscription exists for this user (expected). */
export async function disableReminders(endpoint: string): Promise<boolean> {
  const scope = await verifySession();
  return remindersProvider.deleteSubscription(scope, endpoint);
}

/** Daily keep-alive from an open app; false when the row is gone (browser should resubscribe). */
export async function keepRemindersAlive(endpoint: string): Promise<boolean> {
  const scope = await verifySession();
  return remindersProvider.touchSubscription(scope, endpoint);
}
