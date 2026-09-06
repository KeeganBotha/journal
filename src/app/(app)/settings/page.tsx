import { verifySession } from "@/lib/server/session";
import { SignOutButton } from "../_components/SignOutButton";

// Sign out lives here (SPEC). Push reminder controls arrive in phase 5.
export default async function SettingsPage() {
  await verifySession(); // fail fast (UX) — the real gate is in the service

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground">Account</h2>
        <div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
