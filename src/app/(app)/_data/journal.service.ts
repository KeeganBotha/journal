import "server-only";
import { verifySession } from "@/lib/server/session";
import { oneYearBefore, todayInAppTz, type IsoDate } from "@/lib/server/dates";
import { extractText } from "./journal.content";
import * as journalProvider from "./journal.provider";
import type { EntryDto, EntryListDto } from "./journal.provider";
import type { Mood, TiptapDoc } from "./journal.schemas";

// Business logic layer. Every function verifies the session as its FIRST
// statement and never accepts identity from the caller (PATTERNS.md §2).
// "Today" only ever comes from todayInAppTz() (SPEC rule 2).

/** The Today page's data: which day it is, and that day's entry if written. */
export async function getTodayEntry(): Promise<{
  date: IsoDate;
  entry: EntryDto | null;
}> {
  const scope = await verifySession();
  const date = todayInAppTz();
  const entry = await journalProvider.findEntryByDate(scope, date);
  return { date, entry };
}

/** Returns null when there is no entry for this user on that day (expected). */
export async function getEntry(date: IsoDate): Promise<EntryDto | null> {
  const scope = await verifySession();
  return journalProvider.findEntryByDate(scope, date);
}

/**
 * SPEC rule 7: the entry exactly one year before today, or null. Feb 29 has no
 * match the year before, and a young journal has nothing yet — both null.
 */
export async function getOnThisDay(): Promise<EntryDto | null> {
  const scope = await verifySession();
  const date = oneYearBefore(todayInAppTz());
  if (!date) return null;
  return journalProvider.findEntryByDate(scope, date);
}

/**
 * Upsert on (owner, day) — SPEC rule 3. contentText is re-derived here on
 * every write (rule 4). Returns null when the day is in the future (expected
 * error): a journal records days that have happened.
 */
export async function saveEntry(data: {
  date: IsoDate;
  content: TiptapDoc;
  mood: Mood | null;
}): Promise<EntryDto | null> {
  const scope = await verifySession();
  if (data.date > todayInAppTz()) return null; // IsoDate strings sort lexically
  return journalProvider.upsertEntry(scope, {
    date: data.date,
    content: data.content,
    contentText: extractText(data.content),
    mood: data.mood,
  });
}

/** Returns false when no entry exists for this user on that day (expected error). */
export async function removeEntry(date: IsoDate): Promise<boolean> {
  const scope = await verifySession();
  return journalProvider.deleteEntryByDate(scope, date);
}

export async function searchEntries(options: {
  query: string;
  limit: number;
}): Promise<EntryListDto> {
  const scope = await verifySession();
  return journalProvider.findEntries(scope, options);
}
