import "server-only";
import { db } from "@/lib/server/db";
import { fromIsoDate, type IsoDate } from "@/lib/server/dates";

// ⚠ UNSCOPED BY DESIGN — SPEC decision 2026-09-06 (exception to PATTERNS §2).
// The nightly reminder runs for every user at once and has no session. This
// file is the only unscoped provider outside `*.public.provider.ts`; audit
// with `grep -rl "cron.provider" src`. Only reminders.cron.service.ts may
// import it, and only the cron route may import that.

export type ReminderTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** Every subscription whose owner has NO entry for `date` (SPEC rule 6). */
export async function findSubscriptionsWithoutEntryOn(
  date: IsoDate,
): Promise<ReminderTarget[]> {
  return db.pushSubscription.findMany({
    where: { user: { entries: { none: { date: fromIsoDate(date) } } } },
    select: { endpoint: true, p256dh: true, auth: true },
  });
}

/** Removes subscriptions the push service reported gone (404/410). */
export async function deleteSubscriptionsByEndpoint(
  endpoints: string[],
): Promise<number> {
  if (endpoints.length === 0) return 0;
  const { count } = await db.pushSubscription.deleteMany({
    where: { endpoint: { in: endpoints } },
  });
  return count;
}
