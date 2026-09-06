import Link from "next/link";
import { formatShortDate } from "@/lib/server/dates";
import { MOOD_LABELS } from "@/lib/moods";
import type { EntrySummaryDto } from "../../_data/journal.provider";

// Server component: receives DTOs and renders each day as a link to its edit
// page. Empty states are invitations, and differ for "nothing written yet"
// vs "nothing matched" (UI.md §9).
export function EntryList({
  entries,
  query,
}: {
  entries: EntrySummaryDto[];
  query: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-input px-4 py-10 text-center text-muted-foreground">
        {query
          ? `Nothing mentions “${query}” — try another word.`
          : "No entries yet — write today's on the Today page."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/entries/${entry.date}`}
            className="flex flex-col gap-1 rounded-lg border border-input bg-card px-3 py-2 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                {formatShortDate(entry.date)}
              </span>
              {entry.mood && (
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {MOOD_LABELS[entry.mood]}
                </span>
              )}
            </div>
            {entry.excerpt ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {entry.excerpt}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Empty entry
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
