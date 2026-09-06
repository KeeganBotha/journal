import { formatLongDate } from "@/lib/server/dates";
import { getTodayEntry } from "../_data/journal.service";
import { DeleteEntryButton } from "./DeleteEntryButton";
import { EntryForm } from "./EntryForm";

// Async section (UI.md §6): fetches today's entry inside the page's Suspense
// boundary so the heading paints before the database answers.
export async function TodayEntrySection() {
  const { date, entry } = await getTodayEntry();
  return (
    <div className="flex flex-col gap-4">
      {entry && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Written today — edit below or delete it.
          </p>
          <DeleteEntryButton
            date={date}
            dateLabel={formatLongDate(date)}
            afterDelete="stay"
          />
        </div>
      )}
      {/* key includes the entry's identity so a delete (entry → null) rebuilds
          the editor empty instead of keeping stale text on screen. */}
      <EntryForm key={`${date}:${entry?.id ?? "new"}`} date={date} entry={entry} />
    </div>
  );
}
