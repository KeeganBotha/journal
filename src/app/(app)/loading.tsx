import { Spinner } from "@/components/Spinner";

// Route-level fallback for initial navigation (UI.md §6): just a spinner.
export default function TodayLoading() {
  return <Spinner className="flex-1" />;
}
