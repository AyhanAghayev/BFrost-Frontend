"use client";

import { cn } from "@/lib/utils";

export type FeedFilterType = "relevant" | "latest" | "trending";

interface FeedFilterProps {
  active: FeedFilterType;
  onChange: (filter: FeedFilterType) => void;
}

const FILTERS: { id: FeedFilterType; label: string }[] = [
  { id: "relevant", label: "Relevant" },
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
];

export default function FeedFilter({ active, onChange }: FeedFilterProps) {
  return (
    <div className="flex items-center gap-stack-md border-b border-border-subtle mb-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            "font-label-md text-label-md px-4 py-3 transition-colors",
            active === f.id
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}