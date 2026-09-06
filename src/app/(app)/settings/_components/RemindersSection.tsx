import { config } from "@/lib/server/config";
import { getReminderDeviceCount } from "../_data/reminders.service";
import { ReminderToggle } from "./ReminderToggle";

// Async section (UI.md §6): the device count is fetched inside the page's
// Suspense boundary. The VAPID public key is not a secret, but it still flows
// server → client as a prop from config.ts (SPEC env rules).
export async function RemindersSection() {
  const deviceCount = await getReminderDeviceCount();
  return (
    <div className="flex flex-col gap-3">
      <ReminderToggle vapidPublicKey={config.VAPID_PUBLIC_KEY} />
      <p className="text-xs text-muted-foreground">
        {deviceCount === 0
          ? "No devices get reminders yet."
          : deviceCount === 1
            ? "1 device gets reminders."
            : `${deviceCount} devices get reminders.`}
      </p>
    </div>
  );
}
