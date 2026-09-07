import "server-only";
import { todayInAppTz } from "@/lib/server/dates";
import { sendPush } from "@/lib/server/push";
import * as cronProvider from "./reminders.cron.provider";

// SPEC decision 2026-09-06: this service has no session to verify — the cron
// route authenticates the caller with the CRON_SECRET bearer token BEFORE
// calling it. Nothing else may import this file.

export type ReminderRun = {
  date: string;
  sent: number;
  failed: number;
  /** Push service said 404/410 tonight. */
  removed: number;
  /** Not seen by any browser for STALE_AFTER_DAYS. */
  expired: number;
};

// A browser that has reminders on touches its row every time the app opens
// (KeepRemindersAlive). Apple in particular keeps accepting pushes for a
// registration the device already dropped (seen after a Home Screen
// reinstall, 2026-09-07), so 410-pruning alone lets ghosts accumulate.
// 60 days: anyone who has not opened Journal in two months has left.
export const STALE_AFTER_DAYS = 60;

const REMINDER = {
  title: "Journal",
  body: "You haven't written today.",
  url: "/",
};

/**
 * One push per subscription whose owner hasn't written today (SPEC rule 6).
 * "Today" is APP_TIMEZONE's today (rule 2) — the same helper the Today page
 * uses, so the reminder and the page can never disagree on the day.
 */
export async function sendDailyReminders(): Promise<ReminderRun> {
  const date = todayInAppTz();
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const expired = await cronProvider.deleteSubscriptionsNotSeenSince(cutoff);
  const targets = await cronProvider.findSubscriptionsWithoutEntryOn(date);

  const outcomes = await Promise.all(
    targets.map(async (target) => ({
      endpoint: target.endpoint,
      outcome: await sendPush(target, REMINDER),
    })),
  );

  const gone = outcomes.filter((o) => o.outcome === "gone").map((o) => o.endpoint);
  const removed = await cronProvider.deleteSubscriptionsByEndpoint(gone);

  return {
    date,
    sent: outcomes.filter((o) => o.outcome === "sent").length,
    failed: outcomes.filter((o) => o.outcome === "failed").length,
    removed,
    expired,
  };
}
