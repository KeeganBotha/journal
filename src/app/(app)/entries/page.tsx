import { Suspense } from "react";
import { verifySession } from "@/lib/server/session";
import { limitParamSchema } from "@/lib/pagination";
import { Spinner } from "@/components/Spinner";
import { searchQuerySchema } from "../_data/journal.schemas";
import { EntryListSection } from "./_components/EntryListSection";
import { EntrySearchForm } from "./_components/EntrySearchForm";

export default async function EntriesPage({
  searchParams,
}: PageProps<"/entries">) {
  await verifySession(); // fail fast (UX) — the real gate is in the service
  const params = await searchParams;
  // searchParams are client input (PATTERNS.md §3): both parsers .catch() → never throw.
  const query = searchQuerySchema.parse(params.q);
  const limit = limitParamSchema.parse(params.limit);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        History
      </h1>
      <EntrySearchForm query={query} />
      {/* key on the query only (as Todos keys on its filter): a new search
          swaps the list for the spinner, while "Show more" (a limit change)
          keeps the loaded rows visible and streams the longer list in — its
          pending state lives on the button. */}
      <Suspense key={query} fallback={<Spinner />}>
        <EntryListSection query={query} limit={limit} />
      </Suspense>
    </div>
  );
}
