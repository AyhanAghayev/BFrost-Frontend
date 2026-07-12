"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { searchClubs } from "@/lib/api/clubs";
import { searchUsers } from "@/lib/api/users";
import type { Club, User, Post } from "@/lib/types";

type Tab = "all" | "people" | "clubs" | "posts";
type DateFilter = "any" | "24h" | "week" | "month";
type SortBy = "relevance" | "recent" | "popular";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "people", label: "People" },
  { id: "clubs", label: "Clubs" },
  { id: "posts", label: "Posts" },
];

const CATEGORIES = ["Technology", "Arts", "Business", "Academic", "Volunteering", "Gaming"] as const;

const CATEGORY_ICON: Record<string, string> = {
  Technology: "computer",
  Arts: "palette",
  Business: "business_center",
  Academic: "school",
  Volunteering: "volunteer_activism",
  Gaming: "sports_esports",
};

function msAgo(isoDate: string): number {
  return Date.now() - new Date(isoDate).getTime();
}

const MS = { "24h": 86_400_000, week: 604_800_000, month: 2_592_000_000 };

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";

  const [tab, setTab] = useState<Tab>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [filterOpen, setFilterOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(q);
  const [rawClubs, setRawClubs] = useState<Club[]>([]);
  const [rawUsers, setRawUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setRawClubs([]); setRawUsers([]); return; }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      Promise.all([searchClubs(q), searchUsers(q)])
        .then(([clubs, users]) => { setRawClubs(clubs); setRawUsers(users); })
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const allClubs = useMemo<Club[]>(() => {
    let list = rawClubs;
    if (activeCategories.length > 0)
      list = list.filter((c) => activeCategories.includes(c.category));
    if (sortBy === "popular") list = [...list].sort((a, b) => b.memberCount - a.memberCount);
    return list;
  }, [rawClubs, activeCategories, sortBy]);

  const allUsers = useMemo<User[]>(() => rawUsers, [rawUsers]);

  const allPosts = useMemo<Post[]>(() => [], []);

  function toggleCategory(cat: string) {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function clearFilters() {
    setDateFilter("any");
    setActiveCategories([]);
    setSortBy("relevance");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (localQuery.trim()) router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
  }

  const hasResults = allClubs.length + allUsers.length + allPosts.length > 0;

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
        {/* Heading + tabs */}
        <div className="mb-gutter">
          {q ? (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Results for <span className="text-action-blue">"{q}"</span>
            </h1>
          ) : (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Explore BFrost
            </h1>
          )}

          {/* Tab bar */}
          <div className="flex items-center border-b border-border-subtle gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative px-4 py-3 font-label-md text-label-md whitespace-nowrap transition-colors",
                  tab === t.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* ── Results column ── */}
          <div className="lg:col-span-8 flex flex-col gap-gutter">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFilterOpen((p) => !p)}
              className="lg:hidden flex items-center gap-2 self-start px-4 py-2 border border-border-subtle bg-white rounded-lg font-label-md text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Filters
              {(activeCategories.length > 0 || dateFilter !== "any") && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {activeCategories.length + (dateFilter !== "any" ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Mobile filter panel */}
            {filterOpen && (
              <div className="lg:hidden bg-white border border-border-subtle rounded-xl p-gutter">
                <FilterPanel
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  activeCategories={activeCategories}
                  toggleCategory={toggleCategory}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onApply={() => setFilterOpen(false)}
                  onClear={clearFilters}
                />
              </div>
            )}

            {!hasResults && q && (
              <div className="bg-white border border-border-subtle rounded-xl py-16 flex flex-col items-center gap-3 text-center px-8">
                <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-30">search_off</span>
                <p className="font-label-md text-on-surface">No results for "{q}"</p>
                <p className="text-sm text-on-surface-variant">Try different keywords or remove filters.</p>
              </div>
            )}

            {/* Clubs section */}
            {(tab === "all" || tab === "clubs") && allClubs.length > 0 && (
              <section>
                <SectionHeader
                  title="Clubs"
                  count={allClubs.length}
                  showViewAll={tab === "all" && allClubs.length > 4}
                  onViewAll={() => setTab("clubs")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                  {(tab === "all" ? allClubs.slice(0, 4) : allClubs).map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              </section>
            )}

            {/* People section */}
            {(tab === "all" || tab === "people") && allUsers.length > 0 && (
              <section>
                <SectionHeader
                  title="People"
                  count={allUsers.length}
                  showViewAll={tab === "all" && allUsers.length > 3}
                  onViewAll={() => setTab("people")}
                />
                <div className="flex flex-col gap-stack-sm">
                  {(tab === "all" ? allUsers.slice(0, 3) : allUsers).map((user) => (
                    <PersonRow key={user.id} user={user} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts section */}
            {(tab === "all" || tab === "posts") && allPosts.length > 0 && (
              <section>
                <SectionHeader
                  title="Posts"
                  count={allPosts.length}
                  showViewAll={tab === "all" && allPosts.length > 2}
                  onViewAll={() => setTab("posts")}
                />
                <div className="flex flex-col gap-stack-md">
                  {(tab === "all" ? allPosts.slice(0, 2) : allPosts).map((post) => (
                    <PostRow key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty tab state */}
            {tab === "clubs" && allClubs.length === 0 && (
              <EmptyTab icon="group" label="No clubs match your search." />
            )}
            {tab === "people" && allUsers.length === 0 && (
              <EmptyTab icon="person_search" label="No people match your search." />
            )}
            {tab === "posts" && allPosts.length === 0 && (
              <EmptyTab icon="article" label="No posts match your search." />
            )}
          </div>

          {/* ── Filter sidebar (desktop) ── */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="bg-white border border-border-subtle rounded-xl p-gutter sticky top-24">
              <FilterPanel
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                activeCategories={activeCategories}
                toggleCategory={toggleCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onApply={() => {}}
                onClear={clearFilters}
              />
            </div>
          </aside>
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

function PersonRow({ user }: { user: User }) {
  const [following, setFollowing] = useState(user.isFollowing);

  return (
    <div className="flex items-center justify-between bg-white border border-border-subtle rounded-xl px-stack-md py-3">
      <Link href={`/profile/${user.username}`} className="flex items-center gap-stack-md group">
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-label-md text-primary group-hover:text-action-blue transition-colors">
              {user.displayName}
            </p>
            {user.isVerified && (
              <span
                className="material-symbols-outlined text-action-blue text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {user.department} · {user.university}
          </p>
        </div>
      </Link>
      <button
        onClick={() => setFollowing((p) => !p)}
        className={cn(
          "px-4 py-1.5 rounded-lg text-label-sm font-semibold transition-colors flex-shrink-0",
          following
            ? "bg-surface-container text-on-surface-variant border border-border-subtle"
            : "border-2 border-action-blue text-action-blue hover:bg-action-blue/5"
        )}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function PostRow({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  return (
    <article className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-stack-md">
        {/* Author row */}
        <div className="flex items-center gap-stack-sm mb-stack-md">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="text-label-sm text-primary">
              <span className="font-semibold">{post.author.displayName}</span>
              <span className="text-on-surface-variant font-normal"> in </span>
              <Link href={`/clubs/${post.clubId}`} className="text-action-blue hover:underline">
                {post.clubName}
              </Link>
            </p>
            <p className="text-[10px] text-on-surface-variant">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`}>
          <h3 className="font-headline-md text-headline-md text-primary mb-stack-sm leading-snug hover:text-action-blue transition-colors">
            {post.title}
          </h3>
          <p className="text-on-surface-variant text-sm line-clamp-2 mb-stack-md leading-relaxed">
            {post.body}
          </p>
        </Link>

        {post.imageUrl && (
          <div className="rounded-lg overflow-hidden mb-stack-md border border-border-subtle">
            <img src={post.imageUrl} alt="" className="w-full h-40 object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-gutter border-t border-border-subtle pt-stack-md">
          <button
            onClick={() => {
              setLiked((p) => !p);
              setLikeCount((p) => (liked ? p - 1 : p + 1));
            }}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-action-blue" : "text-on-surface-variant hover:text-action-blue"
            )}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              thumb_up
            </span>
            <span className="text-label-sm">{formatCount(likeCount)}</span>
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-action-blue transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            <span className="text-label-sm">{formatCount(post.commentCount)}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyTab({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white border border-border-subtle rounded-xl py-16 flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-30">{icon}</span>
      <p className="text-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

function FilterPanel({
  dateFilter,
  setDateFilter,
  activeCategories,
  toggleCategory,
  sortBy,
  setSortBy,
  onApply,
  onClear,
}: {
  dateFilter: DateFilter;
  setDateFilter: (v: DateFilter) => void;
  activeCategories: string[];
  toggleCategory: (c: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: "any", label: "Any time" },
    { value: "24h", label: "Past 24 hours" },
    { value: "week", label: "Past week" },
    { value: "month", label: "Past month" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-gutter">
        <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
        <h2 className="font-headline-md text-headline-md text-primary">Filters</h2>
      </div>

      {/* Date filter */}
      <div className="mb-gutter">
        <h3 className="font-label-md text-label-md text-primary mb-stack-md">Post date</h3>
        <div className="flex flex-col gap-stack-sm">
          {DATE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-stack-md cursor-pointer group">
              <input
                type="radio"
                name="dateFilter"
                checked={dateFilter === opt.value}
                onChange={() => setDateFilter(opt.value)}
                className="w-4 h-4 accent-primary"
              />
              <span
                className={cn(
                  "text-label-md transition-colors",
                  dateFilter === opt.value ? "text-primary font-semibold" : "text-on-surface group-hover:text-primary"
                )}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-gutter">
        <h3 className="font-label-md text-label-md text-primary mb-stack-md">Club category</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-label-sm font-semibold transition-colors border",
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-on-surface-variant border-border-subtle hover:border-primary hover:text-primary"
                )}
              >
                <span className="material-symbols-outlined text-[14px]">{CATEGORY_ICON[cat]}</span>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div className="mb-gutter">
        <h3 className="font-label-md text-label-md text-primary mb-stack-md">Sort by</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="w-full bg-surface-faint border border-border-subtle rounded-lg p-2 font-label-md text-on-surface focus:ring-2 focus:ring-action-blue outline-none"
        >
          <option value="relevance">Relevance</option>
          <option value="recent">Most recent</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onApply}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-label-md hover:opacity-90 transition-opacity lg:hidden"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          className="w-full py-2.5 text-on-surface-variant font-label-md hover:bg-surface-container rounded-lg transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
