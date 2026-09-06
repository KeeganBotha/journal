import { searchEntries } from "../../_data/journal.service";
import { LoadMore } from "@/components/LoadMore";
import { EntryList } from "./EntryList";

// Async section (UI.md §6): the data fetch lives INSIDE the Suspense boundary
// so the page shell (heading, search box) never waits on it.
export async function EntryListSection({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) {
  const { entries, totalCount } = await searchEntries({ query, limit });
  return (
    <div className="flex flex-col gap-4">
      <EntryList entries={entries} query={query} />
      <LoadMore
        limit={limit}
        shownCount={entries.length}
        totalCount={totalCount}
      />
    </div>
  );
}
