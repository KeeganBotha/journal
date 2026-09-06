import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Server component: search is a READ, so it is a GET form writing ?q= to the
// URL (PATTERNS.md §1 — never a Server Action for reads; UI.md §8 — shareable
// state lives in the URL). No client JS needed.
export function EntrySearchForm({ query }: { query: string }) {
  return (
    <form action="/entries" method="get" role="search" className="flex gap-2">
      <div className="flex-1">
        <Label htmlFor="entry-search" className="sr-only">
          Search entries
        </Label>
        <Input
          id="entry-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search your entries"
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <Button type="submit" variant="outline" aria-label="Search">
        <Search />
      </Button>
      {query && (
        <Link
          href="/entries"
          aria-label="Clear search"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <X />
        </Link>
      )}
    </form>
  );
}
