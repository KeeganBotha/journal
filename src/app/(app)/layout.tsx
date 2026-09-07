import { verifySession, getSessionUser } from "@/lib/server/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppNav } from "./_components/AppNav";
import { KeepRemindersAlive } from "./_components/KeepRemindersAlive";

// The authenticated app shell: header + top nav. Journal has no containers to
// list (one entry per day, nothing to organise), so unlike Todos there is no
// sidebar — the nav is three views. Sign out lives on /settings (SPEC).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession(); // fail fast (UX) — the real gate is in the service
  const user = await getSessionUser(); // cheap: memoized session, no extra query

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Journal
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <AppNav />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      <KeepRemindersAlive />
    </div>
  );
}
