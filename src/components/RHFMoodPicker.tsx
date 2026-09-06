"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MOODS } from "@/app/(app)/_data/journal.schemas";
import { MOOD_LABELS } from "@/lib/moods";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label?: string;
  disabled?: boolean;
  containerClassName?: string;
};

// Shared RHF field (UI.md §7): a single-select segmented control on the
// shadcn ToggleGroup primitive. The form value is a Mood string or null —
// pressing the active option again clears it (mood is optional, SPEC rule 5).
export function RHFMoodPicker({
  name,
  label,
  disabled,
  containerClassName,
}: Props) {
  const labelId = useId();
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", containerClassName)}>
          {label && <Label id={labelId}>{label}</Label>}
          <ToggleGroup
            variant="outline"
            spacing={0}
            aria-labelledby={label ? labelId : undefined}
            aria-invalid={!!fieldState.error}
            disabled={disabled}
            value={field.value ? [field.value] : []}
            onValueChange={(groupValue) => field.onChange(groupValue[0] ?? null)}
            onBlur={field.onBlur}
            className="w-full sm:w-fit"
          >
            {MOODS.map((mood) => (
              <ToggleGroupItem
                key={mood}
                value={mood}
                aria-label={MOOD_LABELS[mood]}
                className="flex-1 sm:flex-initial"
              >
                {MOOD_LABELS[mood]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {fieldState.error?.message && (
            <p className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
