"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { RHFMoodPicker } from "@/components/RHFMoodPicker";
import { RHFRichText } from "@/components/RHFRichText";
import { saveEntry } from "../actions";
import { EMPTY_DOC, saveEntrySchema } from "../_data/journal.schemas";
import type { EntryDto } from "../_data/journal.provider";

type FormInput = z.input<typeof saveEntrySchema>;
type FormOutput = z.output<typeof saveEntrySchema>;

// The one entry form (SPEC rule 3: save is an upsert, so Today and
// /entries/[date] share it). Canonical RHF pattern (UI.md §7). Mount with
// `key={date}` so switching days rebuilds the editor with that day's content.
export function EntryForm({
  date,
  entry,
}: {
  date: string;
  entry: EntryDto | null;
}) {
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(saveEntrySchema),
    defaultValues: {
      date,
      content: entry?.content ?? EMPTY_DOC,
      mood: entry?.mood ?? null,
    },
  });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (data) => {
    const result = await saveEntry(data);
    if (result.ok) {
      // Keep what was written on screen; just mark the form clean again.
      reset(data);
      toast.success(entry ? "Entry updated" : "Entry saved");
      return;
    }
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        setError(field as keyof FormInput, {
          type: "server",
          message: messages[0],
        });
      }
    } else {
      setError("root", { type: "server", message: result.message });
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <RHFRichText name="content" label="Entry" />
        <RHFMoodPicker name="mood" label="Mood" />
        {/* date travels as a hidden form value; a server disagreement lands here */}
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}
        <div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
