"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import * as journalService from "./_data/journal.service";
import { deleteEntrySchema, saveEntrySchema } from "./_data/journal.schemas";

// Thin entry points for MUTATIONS only (reads go through the page → service).
// Input arrives as an untrusted payload (every action is a public HTTP
// endpoint): safeParse FIRST → call ONE service → return ActionResult.
// Unexpected errors are logged server-side; the client only ever sees a
// generic message (PATTERNS.md §4). unstable_rethrow lets the redirect from
// verifySession() escape the catch.

const GENERIC_ERROR = "Something went wrong on our side — try again.";

// An entry surfaces on Today, in History, and as On This Day next year — a
// mutation refreshes the whole app shell.
function revalidateEntrySurfaces() {
  revalidatePath("/", "layout");
}

export async function saveEntry(input: unknown): Promise<ActionResult<null>> {
  const parsed = saveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const saved = await journalService.saveEntry(parsed.data);
    if (!saved) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: { date: ["You can't write an entry for a day that hasn't happened yet."] },
      };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("saveEntry failed:", error);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateEntrySurfaces();
  return { ok: true, data: null };
}

export async function deleteEntry(input: unknown): Promise<ActionResult<null>> {
  const parsed = deleteEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "That entry no longer exists." };
  }

  try {
    const found = await journalService.removeEntry(parsed.data.date);
    if (!found) return { ok: false, message: "That entry no longer exists." };
  } catch (error) {
    unstable_rethrow(error);
    console.error("deleteEntry failed:", error);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateEntrySurfaces();
  return { ok: true, data: null };
}
