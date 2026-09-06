import { z } from "zod";

// The browser's PushSubscription.toJSON() shape, validated at the action
// boundary (PATTERNS.md §3) — it is client input like anything else.
export const pushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const unsubscribeSchema = z.object({
  endpoint: z.url(),
});
