"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatCount } from "@/lib/utils/format";
import type { Club, ClubCategory } from "@/lib/types";
import { listClubs, joinClub, leaveClub } from "@/lib/api/clubs";

// ── constants ─────────────────────────────────────────────────────────────────

const CAT_ICON: Record<ClubCategory, string> = {
  Technology: "computer",
  Arts: "palette",
  Sports: "sports",
  Science: "science",
  Business: "business_center",
  Social: "diversity_3",
  Cultural: "theater_comedy",
  Academic: "school",
  Volunteering: "volunteer_activism",
  Gaming: "sports_esports",
};

const CAT_COLOR: Record<ClubCategory, string> = {
  Technology: "bg-blue-50 text-blue-700",
  Arts: "bg-purple-50 text-purple-700",
  Sports: "bg-orange-50 text-orange-700",
  Science: "bg-emerald-50 text-emerald-700",
  Business: "bg-amber-50 text-amber-700",
  Social: "bg-pink-50 text-pink-700",
  Cultural: "bg-indigo-50 text-indigo-700",
  Academic: "bg-cyan-50 text-cyan-700",
  Volunteering: "bg-green-50 text-green-700",
  Gaming: "bg-violet-50 text-violet-700",
};

// ── FeaturedCard ──────────────────────────────────────────────────────────────

function FeaturedCard({
  club,
  large,
  joined,
  onJoin,
}: {
  club: Club;
  large: boolean;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const isOwned = club.currentUserRole === "owner" || club.currentUserRole === "moderator";

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className={`relative rounded-2xl overflow-hidden group block ${large ? "h-[240px] sm:h-[300px] md:h-[340px]" : "h-[340px]"}`}
    >
      <img
        src={club.coverImageUrl}
        alt={club.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,27,61,0.92) 0%, rgba(0,27,61,0.3) 55%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 gap-2">
        {large && (
          <span className="inline-flex items-center gap-1 self-start px-3 py-1 bg-action-blue text-white text-[11px] font-bold tracking-widest uppercase rounded-lg mb-1">
            <span className="material-symbols-outlined text-[13px]">star</span>
            Top club
          </span>
        )}
        <h3
          className={`text-white font-headline-md ${large ? "text-headline-lg" : "text-headline-md"} leading-tight`}
        >
          {club.name}
        </h3>
        {large && (
          <p className="text-white/75 text-body-sm leading-relaxed line-clamp-2 max-w-md">
            {club.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-white/80 text-body-sm">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {formatCount(club.memberCount)} members
          </div>
          {large && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!isOwned) onJoin(club.id);
              }}
              className={`px-5 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                isOwned
                  ? "bg-white/20 text-white cursor-default"
                  : joined
                  ? "bg-white/20 text-white"
                  : "bg-white text-primary hover:bg-white/90"
              }`}
            >
              {isOwned ? "Your club" : joined ? "Joined" : "Explore"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── ClubCard ──────────────────────────────────────────────────────────────────

function ClubCard({
  club,
  joined,
  onJoin,
}: {
  club: Club;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const isOwned = club.currentUserRole === "owner" || club.currentUserRole === "moderator";
  const catCls = CAT_COLOR[club.category] ?? "bg-surface-faint text-on-surface-variant";
  const catIcon = CAT_ICON[club.category] ?? "group";

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-stack-md flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <Link href={`/clubs/${club.slug}`} className="flex flex-col gap-3 group">
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${catCls}`}>
            <span className="material-symbols-outlined text-[28px]">{catIcon}</span>
          </div>
          <span className="text-label-sm text-on-surface-variant">{club.category}</span>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface mb-1 group-hover:text-action-blue transition-colors">{club.name}</h4>
          <p className="text-on-surface-variant text-body-sm line-clamp-2">{club.description}</p>
        </div>

        <div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
          <span className="material-symbols-outlined text-[15px]">group</span>
          <span>{formatCount(club.memberCount)} members</span>
          <span className="mx-1 opacity-40">·</span>
          <span className="material-symbols-outlined text-[15px]">event</span>
          <span>{club.eventCount} events</span>
        </div>
      </Link>

      {isOwned ? (
        <Link
          href={`/clubs/${club.slug}`}
          className="w-full py-2.5 rounded-xl border border-border-subtle text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-faint transition-colors mt-auto"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          {club.currentUserRole === "owner" ? "Manage" : "View"}
        </Link>
      ) : joined ? (
        <button
          onClick={() => onJoin(club.id)}
          className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-error hover:border-red-200 transition-colors mt-auto group"
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <span className="group-hover:hidden">Joined</span>
          <span className="hidden group-hover:inline">Leave</span>
        </button>
      ) : (
        <button
          onClick={() => onJoin(club.id)}
          className="w-full py-2.5 rounded-xl border-2 border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-white transition-colors mt-auto"
        >
          Join club
        </button>
      )}
    </div>
  );
}

// ── RecommendedItem ───────────────────────────────────────────────────────────

function RecommendedItem({
  club,
  joined,
  onJoin,
}: {
  club: Club;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const catCls = CAT_COLOR[club.category] ?? "bg-surface-faint text-on-surface-variant";
  const catIcon = CAT_ICON[club.category] ?? "group";

  return (
    <div className="flex items-center gap-3 group hover:bg-white rounded-xl p-2 -mx-2 transition-colors cursor-pointer">
      <Link href={`/clubs/${club.slug}`} className="contents">
        <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${catCls}`}>
          <span className="material-symbols-outlined text-[20px]">{catIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md text-on-surface truncate group-hover:text-action-blue transition-colors">
            {club.name}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {formatCount(club.memberCount)} members
          </p>
        </div>
      </Link>
      <button
        onClick={() => onJoin(club.id)}
        className="shrink-0 text-on-surface-variant hover:text-primary transition-colors"
        title={joined ? "Leave club" : "Join club"}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={joined ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {joined ? "check_circle" : "add_circle"}
        </span>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiscoverPageClient() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ClubCategory | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listClubs()
      .then((data) => {
        setClubs(data);
        setJoinedIds(new Set(data.filter((c) => c.isMember).map((c) => c.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(clubs.map((c) => c.category))].sort() as ClubCategory[],
    [clubs]
  );

  const featured = clubs.slice(0, 2);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return clubs.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = !activeCategory || c.category === activeCategory;
      return matchQ && matchCat;
    });
  }, [clubs, query, activeCategory]);

  const isFiltering = query.trim() !== "" || activeCategory !== null;

  const recommended = useMemo(
    () => clubs.filter((c) => !joinedIds.has(c.id)).slice(0, 3),
    [clubs, joinedIds]
  );

  async function toggleJoin(id: string) {
    setJoinError(null);
    setJoinNotice(null);
    const wasJoined = joinedIds.has(id);

    if (wasJoined) {
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      try {
        await leaveClub(id);
      } catch (err) {
        setJoinedIds((prev) => new Set(prev).add(id));
        setJoinError(err instanceof Error ? err.message : "Failed to leave");
      }
      return;
    }

    try {
      const result = await joinClub(id);
      if (result === "JOINED") {
        setJoinedIds((prev) => new Set(prev).add(id));
      } else {
        setJoinNotice("Request sent — the club admins will review it.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join";
      if (/pending/i.test(msg)) setJoinNotice("Your request is already pending review.");
      else setJoinError(msg);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter pb-20 lg:pb-gutter">
        <div className="mb-stack-lg">
          <div className="h-8 bg-surface-container rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-surface-container rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-border-subtle rounded-xl p-stack-md animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-surface-container mb-3" />
              <div className="h-4 bg-surface-container rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-container rounded mb-1" />
              <div className="h-3 bg-surface-container rounded w-3/4" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter pb-20 lg:pb-gutter">
      {joinError && (
        <div className="mb-stack-md flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-error">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {joinError}
          </span>
          <button
            onClick={() => setJoinError(null)}
            className="material-symbols-outlined text-[18px] text-error/70 hover:text-error"
          >
            close
          </button>
        </div>
      )}
      {joinNotice && (
        <div className="mb-stack-md flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-emerald-700">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            {joinNotice}
          </span>
          <button
            onClick={() => setJoinNotice(null)}
            className="material-symbols-outlined text-[18px] text-emerald-600/70 hover:text-emerald-700"
          >
            close
          </button>
        </div>
      )}
      {/* page header */}
      <div className="flex items-start justify-between gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">
            Explore clubs
          </h1>
          <p className="text-on-surface-variant text-body-sm mt-1">
            Find and join clubs at your university.
          </p>
        </div>
        <Link
          href="/clubs/new"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-body-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          <span className="hidden sm:inline">Start a club</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* search + category chips */}
      <div className="flex flex-col gap-stack-md mb-stack-lg">
        <div className="relative max-w-full sm:max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs, topics, or interests…"
            className="w-full bg-white border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-action-blue/40 focus:border-action-blue transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-stack-sm overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeCategory === null
                ? "bg-primary text-white"
                : "bg-white border border-border-subtle text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white border border-border-subtle text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {CAT_ICON[cat] ?? "group"}
              </span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* featured bento — hidden while filtering */}
      {!isFiltering && featured.length > 0 && (
        <section className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-md">
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-8">
              <FeaturedCard
                club={featured[0]}
                large
                joined={joinedIds.has(featured[0].id)}
                onJoin={toggleJoin}
              />
            </div>
            {featured[1] && (
              <div className="hidden md:block md:col-span-4">
                <FeaturedCard
                  club={featured[1]}
                  large={false}
                  joined={joinedIds.has(featured[1].id)}
                  onJoin={toggleJoin}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* club grid */}
        <div className="order-2 lg:order-1 lg:col-span-8">
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {isFiltering
                ? `${filtered.length} club${filtered.length === 1 ? "" : "s"} found`
                : "All clubs"}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-border-subtle rounded-xl flex flex-col items-center gap-3 py-16 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                search_off
              </span>
              <p className="text-on-surface-variant text-body-sm max-w-xs">
                No clubs match &ldquo;{query}&rdquo;
                {activeCategory ? ` in ${activeCategory}` : ""}. Try a different search.
              </p>
              <button
                onClick={() => { setQuery(""); setActiveCategory(null); }}
                className="text-action-blue font-label-md text-label-md hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
              {filtered.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  joined={joinedIds.has(club.id)}
                  onJoin={toggleJoin}
                />
              ))}
            </div>
          )}
        </div>

        {/* recommended sidebar */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-md">
            Not joined yet
          </h2>
          <div className="bg-white border border-border-subtle rounded-xl p-stack-md lg:sticky lg:top-24">
            {recommended.length === 0 ? (
              <p className="text-on-surface-variant text-body-sm text-center py-4">
                You&apos;ve joined all clubs!
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recommended.map((club) => (
                  <RecommendedItem
                    key={club.id}
                    club={club}
                    joined={joinedIds.has(club.id)}
                    onJoin={toggleJoin}
                  />
                ))}
              </div>
            )}

            <div className="mt-stack-md pt-stack-md border-t border-border-subtle text-center">
              <p className="text-body-sm text-on-surface-variant">
                {formatCount(clubs.reduce((s, c) => s + c.memberCount, 0))} total members
                across {clubs.length} clubs
              </p>
            </div>
          </div>

          {/* stat cards */}
          <div className="mt-stack-md grid grid-cols-2 gap-stack-md">
            <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary font-headline-md">
                {clubs.length}
              </span>
              <span className="text-body-sm text-on-surface-variant">Active clubs</span>
            </div>
            <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary font-headline-md">
                {clubs.reduce((s, c) => s + c.eventCount, 0)}
              </span>
              <span className="text-body-sm text-on-surface-variant">Events hosted</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
