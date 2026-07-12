"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCount } from "@/lib/utils/format";
import { searchClubs } from "@/lib/api/clubs";
import type { Club } from "@/lib/types";

const CATEGORY_ICON: Record<string, string> = {
  Technology: "computer",
  Arts: "palette",
  Business: "business_center",
  Academic: "school",
  Volunteering: "volunteer_activism",
  Gaming: "sports_esports",
};

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";

  const [localQuery, setLocalQuery] = useState(q);
  const [rawClubs, setRawClubs] = useState<Club[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setRawClubs([]); return; }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      searchClubs(q)
        .then((clubs) => setRawClubs(clubs))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const allClubs = rawClubs;
  const hasResults = allClubs.length > 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (localQuery.trim()) router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
  }

  return (
    <div className="flex-1 min-w-0 min-h-screen bg-surface-faint">
      {/* Mobile search bar */}
      <div className="sm:hidden px-margin-mobile pt-4 pb-2">
        <form onSubmit={handleSearch} className="flex items-center bg-white border border-border-subtle rounded-xl px-4 py-2.5 gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
            placeholder="Search BFrost"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(""); router.push("/search"); }}
              className="material-symbols-outlined text-on-surface-variant text-[18px]"
            >
              close
            </button>
          )}
        </form>
      </div>

      <div className="px-margin-mobile md:px-gutter py-gutter max-w-[1280px] mx-auto">
        {/* Heading */}
        <div className="mb-gutter">
          {q ? (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Results for <span className="text-action-blue">&quot;{q}&quot;</span>
            </h1>
          ) : (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Explore BFrost
            </h1>
          )}
        </div>

        <div className="flex flex-col gap-gutter">
          {!hasResults && q && (
            <div className="bg-white border border-border-subtle rounded-xl py-16 flex flex-col items-center gap-3 text-center px-8">
              <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-30">search_off</span>
              <p className="font-label-md text-on-surface">No results for &quot;{q}&quot;</p>
              <p className="text-sm text-on-surface-variant">Try different keywords.</p>
            </div>
          )}

          {/* Clubs section */}
          {allClubs.length > 0 && (
            <section>
              <SectionHeader title="Clubs" count={allClubs.length} showViewAll={false} onViewAll={() => {}} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                {allClubs.map((club) => (
                  <ClubCard key={club.id} club={club} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  showViewAll,
  onViewAll,
}: {
  title: string;
  count: number;
  showViewAll: boolean;
  onViewAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-stack-md">
      <div className="flex items-center gap-2">
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
        <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {showViewAll && (
        <button
          onClick={onViewAll}
          className="text-action-blue font-label-md text-label-md hover:underline"
        >
          View all
        </button>
      )}
    </div>
  );
}

function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="bg-white border border-border-subtle rounded-xl p-stack-md hover:shadow-md transition-shadow group flex gap-stack-md"
    >
      <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-primary text-[28px]">
            {CATEGORY_ICON[club.category] ?? "hub"}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-label-md text-primary group-hover:text-action-blue transition-colors truncate">
          {club.name}
        </h3>
        <p className="text-label-sm text-on-surface-variant mt-0.5">
          {formatCount(club.memberCount)} members · {club.category}
        </p>
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
          {club.description}
        </p>
      </div>
    </Link>
  );
}
