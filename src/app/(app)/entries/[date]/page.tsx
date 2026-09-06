import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/server/session";
import { formatLongDate, todayInAppTz } from "@/lib/server/dates";
import { EntryForm } from "../../_components/EntryForm";
import { getEntry } from "../../_data/journal.service";
import { entryDateParamSchema } from "../../_data/journal.schemas";
import { EntryPageHeader } from "../_components/EntryPageHeader";

export default async function EntryPage({ params }: PageProps<"/entries/[date]">) {
  await verifySession(); // fail fast (UX) — the real gate is in the service

  // Route params are client input (PATTERNS.md §3): parse before any service.
  const { date } = await params;
  const parsed = entryDateParamSchema.safeParse(date);
  if (!parsed.success) notFound();

  const today = todayInAppTz();
  if (parsed.data === today) redirect("/"); // today's canonical home
  if (parsed.data > today) notFound(); // a journal has no future days

  // Param gating, not a data section: the header needs to know whether an
  // entry exists before anything paints, and it's one cheap indexed row.
  // No entry is NOT a 404 — the same form backfills the day (SPEC rule 3).
  const entry = await getEntry(parsed.data);

  return (
    <div className="flex flex-col gap-6">
      <EntryPageHeader
        date={parsed.data}
        dateLabel={formatLongDate(parsed.data)}
        hasEntry={entry !== null}
      />
      <EntryForm
        key={`${parsed.data}:${entry?.id ?? "new"}`}
        date={parsed.data}
        entry={entry}
      />
    </div>
  );
}
