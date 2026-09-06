import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteEntryButton } from "../../_components/DeleteEntryButton";

type Props = {
  date: string;
  /** Pre-formatted by the server (dates.ts is server-only). */
  dateLabel: string;
  hasEntry: boolean;
};

// Server component: back link, heading + subtitle, with the delete leaf only
// when there is something to delete. The back link is a real link to History
// (not history.back()) so it works when the page was opened directly.
export function EntryPageHeader({ date, dateLabel, hasEntry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/entries"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-fit -ml-2 text-muted-foreground",
        )}
      >
        <ArrowLeft />
        Back to History
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {dateLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasEntry
              ? "Edit this day's entry"
              : "Nothing written yet — backfill this day"}
          </p>
        </div>
        {hasEntry && (
          <DeleteEntryButton
            date={date}
            dateLabel={dateLabel}
            afterDelete="history"
          />
        )}
      </div>
    </div>
  );
}
