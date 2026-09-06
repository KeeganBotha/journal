import "server-only";
import { db } from "@/lib/server/db";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionScope } from "@/lib/server/session";
import { fromIsoDate, toIsoDate, type IsoDate } from "@/lib/server/dates";
import { excerptOf } from "./journal.content";
import type { Mood, TiptapDoc } from "./journal.schemas";

// The ONLY file that touches the journal_entry table. Every function takes the
// session scope as its required first parameter and bakes ownerId into the
// query — reads AND writes (PATTERNS.md §2). Explicit select allowlist, never
// raw rows. Dates cross this boundary as IsoDate strings; the Date objects
// Prisma needs for the @db.Date column never escape (SPEC rule 2).

const entrySelect = {
  id: true,
  date: true,
  content: true,
  mood: true,
} as const;

const summarySelect = {
  id: true,
  date: true,
  mood: true,
  contentText: true,
} as const;

export type EntryDto = {
  id: string;
  date: IsoDate;
  content: TiptapDoc;
  mood: Mood | null;
};

export type EntrySummaryDto = {
  id: string;
  date: IsoDate;
  mood: Mood | null;
  excerpt: string;
};

export type EntryListDto = {
  entries: EntrySummaryDto[];
  totalCount: number;
};

type EntryRow = {
  id: string;
  date: Date;
  content: Prisma.JsonValue;
  mood: Mood | null;
};

// `content` was validated by tiptapDocSchema before it was ever written, so
// reading it back as TiptapDoc is a type assertion, not a trust decision.
const toDto = (row: EntryRow): EntryDto => ({
  id: row.id,
  date: toIsoDate(row.date),
  content: row.content as TiptapDoc,
  mood: row.mood,
});

export async function findEntryByDate(
  scope: SessionScope,
  date: IsoDate,
): Promise<EntryDto | null> {
  const row = await db.journalEntry.findUnique({
    where: { ownerId_date: { ownerId: scope.userId, date: fromIsoDate(date) } },
    select: entrySelect,
  });
  return row ? toDto(row) : null;
}

/**
 * SPEC rule 3: saving is an upsert on (ownerId, date) — there is no separate
 * create/edit path, so backfilling a past day is the same call as writing today.
 */
export async function upsertEntry(
  scope: SessionScope,
  data: {
    date: IsoDate;
    content: TiptapDoc;
    contentText: string;
    mood: Mood | null;
  },
): Promise<EntryDto> {
  const date = fromIsoDate(data.date);
  const content = data.content as Prisma.InputJsonValue;
  const row = await db.journalEntry.upsert({
    where: { ownerId_date: { ownerId: scope.userId, date } },
    create: {
      ownerId: scope.userId,
      date,
      content,
      contentText: data.contentText,
      mood: data.mood,
    },
    update: {
      content,
      contentText: data.contentText,
      mood: data.mood,
    },
    select: entrySelect,
  });
  return toDto(row);
}

// deleteMany so a miss (no entry that day, or someone else's — indistinguishable
// by design) is a count of 0, not a thrown error.
export async function deleteEntryByDate(
  scope: SessionScope,
  date: IsoDate,
): Promise<boolean> {
  const { count } = await db.journalEntry.deleteMany({
    where: { ownerId: scope.userId, date: fromIsoDate(date) },
  });
  return count > 0;
}

// List reads are always capped (PATTERNS.md §5). `limit` is client input, but
// it arrives here already parsed and capped by the shared limitParamSchema.
// Search is a case-insensitive `contains` on contentText only (SPEC rule 4).
export async function findEntries(
  scope: SessionScope,
  options: { query: string; limit: number },
): Promise<EntryListDto> {
  const where = {
    ownerId: scope.userId,
    ...(options.query && {
      contentText: { contains: options.query, mode: "insensitive" as const },
    }),
  };
  const [rows, totalCount] = await Promise.all([
    db.journalEntry.findMany({
      where,
      select: summarySelect,
      orderBy: { date: "desc" },
      take: options.limit,
    }),
    db.journalEntry.count({ where }),
  ]);
  return {
    entries: rows.map((row) => ({
      id: row.id,
      date: toIsoDate(row.date),
      mood: row.mood,
      excerpt: excerptOf(row.contentText),
    })),
    totalCount,
  };
}
