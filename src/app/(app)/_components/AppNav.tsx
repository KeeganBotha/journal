"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Today" },
  { href: "/entries", label: "History" },
  { href: "/settings", label: "Settings" },
] as const;

// Client leaf: needs usePathname to highlight the current view. All three are
// VIEWS (UI.md §9) — there are no containers in a journal.
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex gap-1 rounded-lg bg-muted p-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
