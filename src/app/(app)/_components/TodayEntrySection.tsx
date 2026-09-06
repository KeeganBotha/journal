import { getTodayEntry } from "../_data/journal.service";
import { EntryForm } from "./EntryForm";

// Async section (UI.md §6): fetches today's entry inside the page's Suspense
// boundary so the heading paints before the database answers.
export async function TodayEntrySection() {
  const { date, entry } = await getTodayEntry();
  return <EntryForm key={date} date={date} entry={entry} />;
}
