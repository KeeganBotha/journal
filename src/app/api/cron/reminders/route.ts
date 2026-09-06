import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/lib/server/config";
import { sendDailyReminders } from "@/app/(app)/settings/_data/reminders.cron.service";

// External endpoint (Vercel Cron) — a legitimate route handler per PATTERNS §8:
// verify the caller FIRST, then delegate to a service. Vercel sends
// `Authorization: Bearer <CRON_SECRET>` when that env var is set on the project.
// GET because that is what Vercel Cron issues.

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${config.CRON_SECRET}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const run = await sendDailyReminders();
  console.info("reminders cron:", run);
  return NextResponse.json(run);
}
