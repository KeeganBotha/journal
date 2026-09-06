import { z } from "zod";

// One schema, two jobs (UI.md §7): react-hook-form validates with it client-
// side via zodResolver, and the action safeParses the payload server-side —
// the real gate (PATTERNS.md §3). Never redefine validation inline.

/** Calendar day as "YYYY-MM-DD" — the only shape dates take above the provider. */
export const isoDateSchema = z.iso.date("Enter a valid date.");

// Mirrors the Prisma `Mood` enum by value; the provider passes it straight through.
export const MOODS = ["GREAT", "GOOD", "OKAY", "LOW", "ROUGH"] as const;
export const moodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof moodSchema>;

// Tiptap document JSON (SPEC rule 8): top-level `type: "doc"`, size-capped.
// Nodes are loosely typed on purpose — the editor owns the node schema; we
// only guarantee it is a doc and not enormous. Rendered ONLY via Tiptap.
export const MAX_CONTENT_CHARS = 100_000;

const tiptapNodeSchema: z.ZodType<{ type: string }> = z.looseObject({
  type: z.string(),
});

export const tiptapDocSchema = z
  .looseObject({
    type: z.literal("doc"),
    content: z.array(tiptapNodeSchema).optional(),
  })
  .refine((doc) => JSON.stringify(doc).length <= MAX_CONTENT_CHARS, {
    message: "This entry is too long to save — trim it a little.",
  });
export type TiptapDoc = z.infer<typeof tiptapDocSchema>;

/** An empty Tiptap document — the form's initial value for a day without an entry. */
export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [] };

export const saveEntrySchema = z.object({
  date: isoDateSchema,
  content: tiptapDocSchema,
  // null in → null out (idempotent, UI.md §7); the picker holds null when cleared.
  mood: moodSchema.nullable(),
});

export const deleteEntrySchema = z.object({
  date: isoDateSchema,
});

// Route params and search params are client input too (PATTERNS.md §3).
export const entryDateParamSchema = isoDateSchema;

// ?q= — garbage never throws; over-long input is clipped rather than rejected.
export const searchQuerySchema = z
  .string()
  .trim()
  .max(200)
  .catch("");
