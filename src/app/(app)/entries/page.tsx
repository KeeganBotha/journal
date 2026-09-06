import { verifySession } from "@/lib/server/session";

// Phase 2 shell — search + list arrive in phase 4.
export default async function EntriesPage() {
  await verifySession(); // fail fast (UX) — the real gate is in the service

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        History
      </h1>
    </div>
  );
}
