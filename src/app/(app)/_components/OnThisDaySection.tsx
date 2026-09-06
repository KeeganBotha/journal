import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatLongDate } from "@/lib/server/dates";
import { MOOD_LABELS } from "@/lib/moods";
import { RichTextView } from "@/components/RichTextView";
import { getOnThisDay } from "../_data/journal.service";

// Async section (UI.md §6) for SPEC rule 7: renders ONLY when an entry exists
// exactly one year ago — a young journal gets no empty-state noise here.
export async function OnThisDaySection() {
  const entry = await getOnThisDay();
  if (!entry) return null;

  return (
    <section
      aria-labelledby="on-this-day"
      className="flex flex-col gap-3 rounded-lg border border-input bg-card px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="on-this-day" className="text-sm font-medium text-foreground">
            On this day last year
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatLongDate(entry.date)}
            {entry.mood && ` · ${MOOD_LABELS[entry.mood]}`}
          </p>
        </div>
        <Link
          href={`/entries/${entry.date}`}
          className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <RichTextView content={entry.content} className="text-muted-foreground" />
    </section>
  );
}
