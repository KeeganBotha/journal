import "server-only";
import { z } from "zod";

// The ONLY file allowed to touch process.env (PATTERNS.md §6).
// Validated once at startup — a missing or malformed variable fails fast here.
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Web push (SPEC "Env"). The public key is not a secret but still reaches
  // the client as a prop from the server — never via NEXT_PUBLIC_.
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z
    .string()
    .regex(/^mailto:.+@.+/, "VAPID_SUBJECT must be a mailto: address"),
  // Vercel sends this as `Authorization: Bearer <CRON_SECRET>` to cron routes.
  CRON_SECRET: z.string().min(16),
  // Every "today" in the app is computed in this zone (SPEC rule 2).
  APP_TIMEZONE: z
    .string()
    .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), {
      message: "APP_TIMEZONE must be an IANA zone name, e.g. Africa/Johannesburg",
    }),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const config = parsed.data;
