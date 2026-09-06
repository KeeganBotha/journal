"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import * as remindersService from "./_data/reminders.service";
import {
  pushSubscriptionSchema,
  unsubscribeSchema,
} from "./_data/reminders.schemas";

// Thin entry points for MUTATIONS only: safeParse FIRST → call ONE service →
// return ActionResult (PATTERNS.md §3/§4). These carry no user-typed fields,
// so a validation failure is a generic message, not field errors.

const GENERIC_ERROR = "Something went wrong on our side — try again.";
const BAD_SUBSCRIPTION =
  "Your browser sent an unusable subscription — try turning reminders off and on again.";

export async function subscribeToReminders(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: BAD_SUBSCRIPTION };

  try {
    await remindersService.enableReminders(parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("subscribeToReminders failed:", error);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/settings");
  return { ok: true, data: null };
}

export async function unsubscribeFromReminders(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = unsubscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: BAD_SUBSCRIPTION };

  try {
    // A miss is fine: the browser side is already unsubscribed either way.
    await remindersService.disableReminders(parsed.data.endpoint);
  } catch (error) {
    unstable_rethrow(error);
    console.error("unsubscribeFromReminders failed:", error);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/settings");
  return { ok: true, data: null };
}
