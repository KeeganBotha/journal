import type { Mood } from "@/app/(app)/_data/journal.schemas";

// Display copy for the Mood enum — shared by the picker (Today) and the
// history list, so it lives outside either feature. Sentence case (UI.md §9).
export const MOOD_LABELS: Record<Mood, string> = {
  GREAT: "Great",
  GOOD: "Good",
  OKAY: "Okay",
  LOW: "Low",
  ROUGH: "Rough",
};
