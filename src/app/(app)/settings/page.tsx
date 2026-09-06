import { Suspense } from "react";
import { verifySession } from "@/lib/server/session";
import { Spinner } from "@/components/Spinner";
import { SignOutButton } from "../_components/SignOutButton";
import { RemindersSection } from "./_components/RemindersSection";

export default async function SettingsPage() {
  await verifySession(); // fail fast (UX) — the real gate is in the service

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Reminders</h2>
          <p className="text-sm text-muted-foreground">
            A nightly nudge on this device if today&apos;s entry is still empty.
          </p>
        </div>
        <Suspense fallback={<Spinner className="py-2" />}>
          <RemindersSection />
        </Suspense>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">Account</h2>
        <div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
