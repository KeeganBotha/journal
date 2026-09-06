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
  removed: number;
};

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
  };
}
