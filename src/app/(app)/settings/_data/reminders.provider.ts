import "server-only";
import { db } from "@/lib/server/db";
import type { SessionScope } from "@/lib/server/session";

// The ONLY file that touches push_subscription for the signed-in user. Every
// function takes the session scope first and bakes userId into the query
// (PATTERNS.md §2). (The cron's cross-user read lives in
// reminders.cron.provider.ts under the SPEC's dated exception.)

export async function countSubscriptions(scope: SessionScope): Promise<number> {
  return db.pushSubscription.count({ where: { userId: scope.userId } });
}

/**
 * A push endpoint identifies one browser profile on one device. If that
 * browser was previously subscribed under another account on this machine,
 * the endpoint now belongs to whoever is signed in — the caller proved
 * possession by producing it — so the upsert re-homes it to the scope.
 */
export async function upsertSubscription(
  scope: SessionScope,
  data: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  await db.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: { ...data, userId: scope.userId },
    update: { p256dh: data.p256dh, auth: data.auth, userId: scope.userId },
    select: { id: true },
  });
}

// deleteMany so a miss (unknown endpoint, or one that isn't this user's) is a
// count of 0, not a thrown error.
export async function deleteSubscription(
  scope: SessionScope,
  endpoint: string,
): Promise<boolean> {
  const { count } = await db.pushSubscription.deleteMany({
    where: { endpoint, userId: scope.userId },
  });
  return count > 0;
}
