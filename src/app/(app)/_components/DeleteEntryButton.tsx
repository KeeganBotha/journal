"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteEntry } from "../actions";

type Props = {
  date: string;
  /** Pre-formatted by the server (dates.ts is server-only). */
  dateLabel: string;
  /** Where to go once the entry is gone: stay (Today) or back to History. */
  afterDelete: "stay" | "history";
};

// Client leaf owning the delete flow (confirm → action → toast → navigate).
// Rendered only when an entry exists — a day with nothing written gets no
// trigger, not a disabled one (UI.md §9).
export function DeleteEntryButton({ date, dateLabel, afterDelete }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    const result = await deleteEntry({ date });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    // The toast survives navigation (Toaster lives in the root layout).
    toast.success("Entry deleted");
    if (afterDelete === "history") router.push("/entries");
    else router.refresh(); // Today re-renders with an empty form
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <ConfirmDialog
        trigger={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Delete entry"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        }
        title="Delete this entry?"
        description={`Everything you wrote on ${dateLabel} will be gone. There's no undo.`}
        confirmLabel="Delete entry"
        onConfirm={onDelete}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
