import "server-only";
import { format } from "date-fns";
import { config } from "./config";

/** A calendar day as "YYYY-MM-DD". The only shape a date takes above the provider. */
export type IsoDate = string;

const appTzFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: config.APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Today's calendar day in APP_TIMEZONE (SPEC rule 2). Never use `new Date()`
 * for "today" anywhere else — at 10pm local the server's UTC date may
 * already be tomorrow. Shared by the Today page, On This Day, and the cron.
 */
export function todayInAppTz(now: Date = new Date()): IsoDate {
  const parts = appTzFormatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Provider-side codec: a `@db.Date` column comes back as UTC midnight. */
export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Provider-side codec: an IsoDate becomes the UTC-midnight Date Prisma stores. */
export function fromIsoDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/**
 * The same calendar day one year earlier (On This Day, SPEC rule 7). Returns
 * null when no such day exists — Feb 29 has no exact match the year before.
 */
export function oneYearBefore(iso: IsoDate): IsoDate | null {
  const [year, month, day] = iso.split("-").map(Number);
  const candidate = new Date(Date.UTC(year - 1, month - 1, day));
  return candidate.getUTCMonth() === month - 1 ? toIsoDate(candidate) : null;
}

/**
 * Presentation only: "Saturday, 6 September 2026". Parses the IsoDate as a
 * local-midnight Date so date-fns's `format` can't shift the day.
 */
export function formatLongDate(iso: IsoDate): string {
  return format(new Date(`${iso}T00:00:00`), "EEEE, d MMMM yyyy");
}
