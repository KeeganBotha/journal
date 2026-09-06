import { Suspense } from "react";
import { verifySession } from "@/lib/server/session";
import { formatLongDate, todayInAppTz } from "@/lib/server/dates";
import { Spinner } from "@/components/Spinner";
import { TodayEntrySection } from "./_components/TodayEntrySection";

export default async function TodayPage() {
  await verifySession(); // fail fast (UX) — the real gate is in the service
  const today = todayInAppTz(); // SPEC rule 2: never the server's local date

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {formatLongDate(today)}
        </h1>
        <p className="text-sm text-muted-foreground">Today</p>
      </div>
      {/* Data-bearing region fetches inside its own boundary (UI.md §6). */}
      <Suspense fallback={<Spinner />}>
        <TodayEntrySection />
      </Suspense>
    </div>
  );
}
