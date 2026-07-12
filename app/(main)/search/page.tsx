import { Suspense } from "react";
import SearchPageClient from "@/components/search/SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-on-surface-variant">Loading…</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
